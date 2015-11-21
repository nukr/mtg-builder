import rethinkdbdash from 'rethinkdbdash'
import oboe from 'oboe'
import config from './config'

let r = rethinkdbdash(config.rethinkdb)

function downloadJSON (url) {
  return new Promise((resolve, reject) => {
    oboe(url).done(resolve).fail(reject)
  })
}

function createTable (dbName, tableName) {
  return r.branch(
    r.db(dbName).tableList().contains(tableName),
    r.db(dbName).table(tableName).delete().do(() => {
      return r.db('rethinkdb').table('table_config').filter({name: tableName, db: dbName}).nth(0)
    }),
    r.db(dbName).tableCreate(tableName)('config_changes').nth(0)('new_val')
  )
}

;(async () => {
  await r.branch(
    r.dbList().contains('mtg'),
    r.db('rethinkdb').table('db_config').filter({name: 'mtg'}).nth(0),
    r.dbCreate('mtg')('config_changes').nth(0)('new_val')
  )

  await createTable('mtg', 'cards')
  await createTable('mtg', 'sets')

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

  r.getPoolMaster().drain()
})().catch(console.log)
