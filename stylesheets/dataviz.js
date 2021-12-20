export const createChart = data => {
  const dataviz = document.querySelector('.dataviz')

  const margin = 50

  let svg = d3.select('.dataviz').append('svg').attr('class', 'svg')

  svg.append('text').attr('class', 'title').text('Bitcoin historical price')

  // tooltip
  d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')

  // scales
  let xScale = d3.scaleTime().domain(d3.extent(data, row => new Date(row.date)))

  let yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, row => Number(row.price)))

  // line
  const line = d3
    .line()
    .curve(d3.curveMonotoneX) // d3.curveNatural
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(d.price))

  // path for the line
  svg
    .append('path')
    .datum(data)
    .attr('class', 'viz-area')
    .attr('stroke-width', 2)

  // circles
  const radius = data.length < 100 ? 4 : 1

  svg
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('data-date', d => new Date(d.date).toLocaleDateString())
    .attr('data-price', d => d.price)
    .attr('r', radius)
    .attr('class', 'dot')

  // axes
  const xAxis = svg.append('g').attr('class', 'xAxis')
  const yAxis = svg.append('g').attr('class', 'yAxis')

  // tooltip functions
  d3.selectAll('circle')
    .on('mouseover', (e, d) => {
      d3.select('.tooltip')
        .style('left', `${e.pageX + 5}px`)
        .style('top', `${e.pageY + 5}px`)
        .style('opacity', 1)

        .html(`€ ${d.price}<br> ${new Date(d.date).toLocaleDateString()}`)
        .transition()
        .duration(200)
    })

    .on('mouseout', () => {
      d3.select('.tooltip').style('opacity', 0)
    })

  //get current dataviz/container width and finish drawing the graph

  const drawChart = () => {
    const width = dataviz.getBoundingClientRect().width
    const height = width / 1.5
    const amount = width < 700 ? 3 : 6

    d3.select('text')
      .attr('transform', `translate(${width / 2}, ${margin / 1.5})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')

    svg.attr('width', width).attr('height', height)

    xScale.range([2 * margin, width - margin])
    yScale.range([height - margin, margin]).nice()

    xAxis
      .attr('transform', `translate(0, ${height - margin})`)
      .call(d3.axisBottom(xScale).ticks(amount))

    yAxis.attr('transform', `translate(${margin * 1.5}, 0)`).call(
      d3
        .axisLeft(yScale)
        .tickSize(-width + 2 * margin)
        .tickPadding(10)
    )

    svg.select('path').attr('d', line)

    d3.selectAll('circle')
      .attr('cx', d => xScale(new Date(d.date)))
      .attr('cy', d => yScale(d.price))
  }

  drawChart()

  // make chart responsive with a 200ms delay on resize
  window.addEventListener('resize', debounce(drawChart, 200))

  //https://chrisboakes.com/how-a-javascript-debounce-function-works/
  function debounce(callback, wait) {
    let timeout
    return (...args) => {
      const context = this
      clearTimeout(timeout)
      timeout = setTimeout(() => callback.apply(context, args), wait)
    }
  }
}
