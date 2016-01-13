import xml2js from 'xml2js'
import http from 'http'

function downloadXML (url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
      res.on('error', reject)
    })
  })
}

function parseXML2JS (xmlString) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

export default async () => {
  let xml = await downloadXML('http://mtgjson.com/atom.xml')
  let rss = await parseXML2JS(xml)
  return rss.feed.entry[0].title[0]
}
