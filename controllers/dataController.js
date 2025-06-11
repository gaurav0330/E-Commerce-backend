const fs = require('fs');
const { parse } = require('csv-parse');
const _ = require('lodash');

const dataController = {
  getRandomData: (req, res) => {
    const data = [];

    fs.createReadStream('./data.csv')
      .pipe(parse({ columns: true }))
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        const randomData = _.sampleSize(data, 10);
        res.json(randomData);
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'Failed to read CSV file' });
      });
  }
};

module.exports = dataController;