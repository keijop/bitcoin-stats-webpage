import {
  getData,
  longestBearishTrend,
  maxCap,
  optimalBuySellDays,
  toUnixTimestamp,
  formatDataToDaily,
  formatDataForDataviz,
  setDateConstraint,
  displayData,
  scrollToView,
  removePreviousGraph,
} from './helpers.js'
import { createChart } from './dataviz.js'

const form = document.querySelector('form')
const graphCard = document.querySelector('.graph')
const from = document.querySelector('#startDate')
const info = document.querySelector('.info')
let data

// set todays date as max date for input fields

setDateConstraint()

// prevent end date < start date
// set 'from' date  as min for 'to' date input

from.addEventListener('input', e => {
  document.querySelector('#endDate').setAttribute('min', e.target.value)
})

const baseUrl =
  'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur'

const submitHandler = async event => {
  event.preventDefault()

  info.textContent = 'Loading data ...'

  const startDateString = document.querySelector('#startDate').value
  const endDateString = document.querySelector('#endDate').value

  const start = toUnixTimestamp(startDateString)
  let end = toUnixTimestamp(endDateString) + 60 * 60 // add one hour in seconds

  const url = `${baseUrl}&from=${start}&to=${end}`

  const dataFromAPI = await getData(url)

  if (dataFromAPI instanceof Error) {
    info.textContent = 'Something went wrong, please try again...'
    return
  }

  // check period length and format data accordingly
  // 1 day (86400 sec) - data in 5 min interval
  // 1 - 90 days (7776000 seconds) - day - 1 hour interval
  // 91 and more - 1 day interval

  const today = new Date().toISOString().split('T')[0]

  if (end - start <= 90000 && endDateString === today) {
    data = await formatDataToDaily(dataFromAPI, '5 min')
  } else if (end - start < 7776000) {
    data = await formatDataToDaily(dataFromAPI, 'hour')
  } else {
    data = await getData(url)
  }

  const maxVolume = await maxCap(data)
  const longestBearish = await longestBearishTrend(data)
  const buySellDates = await optimalBuySellDays(data)

  const buy = buySellDates.buy
    ? new Date(buySellDates.sell).toLocaleDateString()
    : 'HOLD'

  const sell = buySellDates.sell
    ? new Date(buySellDates.sell).toLocaleDateString()
    : 'HOLD'

  const bearishString =
    longestBearish === 1 ? `${longestBearish} DAY` : `${longestBearish} DAYS`

  displayData('bearishTrend', bearishString)
  displayData('maxVolume', `${maxVolume.volume} \n ${maxVolume.date}`)
  displayData('sell', sell)
  displayData('buy', buy)

  document.querySelector('.content').classList.add('up')
  info.textContent = ''
  document.querySelector('.results').classList.remove('hide')

  // don't show graph, graphCard for one day, no value for user
  // remove previous graph from DOM
  // create graph and append to DOM

  if (data.prices.length <= 1) {
    graphCard.style.display = 'none'
    removePreviousGraph()
  } else {
    graphCard.style.display = 'flex'
    removePreviousGraph()
    createChart(formatDataForDataviz(data))
  }
}

graphCard.addEventListener('click', () => {
  const graph = document.querySelector('.dataviz')
  scrollToView(graph)
})

// clear user input

window.addEventListener('load', form.reset())

window.addEventListener('resize', () => {
  window.innerWidth < 1100
    ? graphCard.classList.add('hide')
    : graphCard.classList.remove('hide')
})

form.addEventListener('submit', submitHandler)
