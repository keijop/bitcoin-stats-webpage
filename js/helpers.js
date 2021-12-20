// -------------- API DATA STRUCTURE --------------
//  obj {
//    property : [ [date, somevalue], [...], ...]
//    property : [ [date, somevalue], [...], ...]
//    property : [ [date, somevalue], [...], ...]
//  }

// convert date string to UNIX timestamp in seconds

export const toUnixTimestamp = dateString =>
  new Date(dateString).getTime() / 1000

// set todays date as max attribute for date inputs, format YYYY-MM-DD

export const setDateConstraint = () => {
  const today = new Date().toISOString().split('T')[0]
  document.querySelector('#startDate').setAttribute('max', today)
  document.querySelector('#endDate').setAttribute('max', today)
}

export const formatDataForDataviz = data => {
  let formattedData = data.prices.map(datePrice => {
    return { date: datePrice[0], price: datePrice[1].toFixed(2) }
  })
  return formattedData
}

export const scrollToView = elem => {
  let elemY = elem.getBoundingClientRect().y
  let elemHeight = elem.getBoundingClientRect().height
  window.scrollTo(0, elemY + elemHeight)
}

export const removePreviousGraph = () => {
  const previousGraph = document.querySelector('.svg')
  if (previousGraph) previousGraph.remove()
}

// -------------- DISPLAY DATA --------------

export const displayData = (target, text) => {
  const element = document.querySelector(`.${target} p`)
  element.textContent = text
}

// -------------- FETCH DATA --------------

export const getData = async url => {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

// -------------- FORMAT DATA --------------

// data is either in 5 minute interval or in 1 hour interval
// 24 h / 5 min = 288
// decalre empty object
// decalre step and assign value based on granularity argument
// for...in to iterate over data object properties
// for each property value apply filter to only include first item and every nth (step)
// assign filtered values to new object with original property names

export const formatDataToDaily = async (data, granularity) => {
  let formattedData = {}
  const step = granularity === '5 min' ? 288 : 24
  for (const property in data) {
    const hourlyValues = data[property]
    const dailyValues = hourlyValues.filter((element, index) => {
      if (index === 0) return element // always include first element
      if (index % step === 0) return element // include every nth element (step)
    })
    formattedData[property] = dailyValues
  }
  return formattedData
}

// -------------- MAX VOLUME --------------

export const maxCap = async data => {
  const onlyVolumes = data.total_volumes.map(dateAndVolume => dateAndVolume[1])
  const maxVolume = Math.max(...onlyVolumes)
  const result = data.total_volumes.find(
    dateAndVolume => dateAndVolume[1] === maxVolume
  )
  const resultObject = {
    date: new Date(result[0]).toLocaleDateString(),
    volume: '€ ' + Number(result[1]).toLocaleString(),
  }
  return resultObject
}

// -------------- BUY/SELL --------------

// for each item create subarr from the item to end of arr
// find highest price for subarr
// compare subarr highest price to current item price
// if price difference is negative or less than already assigned in optimalDays return
// assign values to optimalDays - current item as buy day, highest price day as sell day, price diff

export const optimalBuySellDays = async data => {
  const optimalDays = { buy: '', sell: '', priceDifference: '' }

  data.prices.forEach((currentDatePrice, index, priceDataArr) => {
    const subArr = priceDataArr.slice(index)

    const subArrHighestPrice = Math.max(
      ...subArr.map(datePrice => datePrice[1])
    )
    const priceDifference = subArrHighestPrice - currentDatePrice[1]

    if (priceDifference < optimalDays.priceDifference || priceDifference <= 0)
      return

    optimalDays.buy = currentDatePrice[0]
    optimalDays.sell = subArr.find(item => item[1] === subArrHighestPrice)[0]
    optimalDays.priceDifference = priceDifference
  })

  return optimalDays
}

// -------------- BEARISH TREND --------------

export const longestBearishTrend = async data => {
  const pricesArr = data.prices.map(priceDate => priceDate[1])

  // iterate over pricesArr and interpolate items into strings ('down', 'up')
  //according to 'bearish trend' definition: day N price < N + 1 price

  const trendsArr = pricesArr.map((price, index, pricesArr) => {
    return price < pricesArr[index - 1] ? 'down' : 'up'
  })

  const trends = {
    current: [],
    longest: [],
  }

  // utility function, compares trends and reassigns values

  const reset = () => {
    if (trends.current.length > trends.longest.length) {
      trends.longest = trends.current
    }
    trends.current = []
  }

  // iterate over trends array, push 'down' trend into trends obj
  // if 'down' is last item in array calls reset()
  // 'up' trend calls reset()

  trendsArr.forEach((trend, index, arr) => {
    if (trend === 'down') {
      trends.current.push(trend)
      if (index + 1 === arr.length) reset() // reset if item is last item in the array
    } else {
      reset()
    }
  })

  return trends.longest.length
}
