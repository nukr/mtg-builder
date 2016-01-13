import rethinkdbdash from 'rethinkdbdash'
import oboe from 'oboe'
import config from './config'
import getLatestVersion from './get-latest-version'

function downloadJSON (url) {
  return new Promise((resolve, reject) => {
    oboe(url).done(resolve).fail(reject)
  })
}

function createTable (dbName, tableName, r) {
  return r.branch(
    r.db(dbName).tableList().contains(tableName),
    r.db(dbName).table(tableName).delete().do(() => {
      return r.db('rethinkdb').table('table_config').filter({name: tableName, db: dbName}).nth(0)
    }),
    r.db(dbName).tableCreate(tableName)('config_changes').nth(0)('new_val')
  )
}

export default async () => {
  let r = rethinkdbdash(config.rethinkdb)
  console.log('start building mtg database')
  let latestVersion = await getLatestVersion()
  console.log(`latestVersion is ${latestVersion}`)

  let currentVersion = await r.branch(
    r.dbList().contains('mtg'),
    r.branch(
      r.db('mtg').tableList().contains('info'),
      r.db('mtg').table('info').get('version')('value').default(null),
      null
    ),
    null
  )
  console.log(`currentVersion is ${currentVersion}`)

  // 1. 檢查版本：將最新的版本與本地的版本比對
  if (latestVersion === currentVersion) {
    // 2. 相同：啥事都不做
    console.log('This is latest version')
    return r.getPoolMaster().drain()
  }

  // 3. 不同：整個毀掉重建
  console.log('building database')
  await r.branch(
    r.dbList().contains('mtg'),
    r.db('rethinkdb').table('db_config').filter({name: 'mtg'}).nth(0),
    r.dbCreate('mtg')('config_changes').nth(0)('new_val')
  )

  await createTable('mtg', 'cards', r)
  await createTable('mtg', 'sets', r)
  await createTable('mtg', 'info', r)

  let allSetJson = await downloadJSON('http://mtgjson.com/json/AllSets-x.json')
  let fns = []

  for (let set in allSetJson) {
    let fn = async () => {
      let cardsInsertQuery = allSetJson[set]['cards'].map(card => {
        card.code = allSetJson[set]['code']
        return r.db('mtg').table('cards').insert(card)
      })
      await Promise.all(cardsInsertQuery)
      delete allSetJson[set]['cards']
      await r.db('mtg').table('sets').insert(allSetJson[set])
    }

    fns.push(fn)
  }

  for (var i = 0, len = fns.length; i < len; i++) {
    console.log(`await fns[${i}] start`)
    await fns[i]()
    console.log(`await fns[${i}] end`)
  }

  await r.db('mtg').table('info').insert({
    id: 'version',
    value: latestVersion
  })

  r.getPoolMaster().drain()
}
