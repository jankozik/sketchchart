/* eslint-disable react/no-array-index-key */
import * as React from 'react'
import * as d3Shape from 'd3-shape'
import { Path, Circle } from 'react-roughjs'
import { BaseChartComponentProps } from '../baseTypes'
import { useChartContext } from '../hooks/useChartContext'


export interface LineSeriesProps<T extends object> extends BaseChartComponentProps {
  dataKey: keyof T
}


export const LineSeries = <T extends object>(props: LineSeriesProps<T>) => { // eslint-disable-line
  const { scaleData, data, options } = useChartContext(props, 'lineDataKeys')
  const { xScale, yScale, xDataKey } = scaleData
  const { dataKey } = props
  if (!xScale || !yScale || !dataKey || !xDataKey) {
    return null
  }
  const ticks = ('ticks' in xScale) ? xScale.ticks() : xScale.domain()
  const bandwidth = xScale(ticks[1]) - xScale(ticks[0])
  const points: [number, number][] = data.map((item: any) => ([
    xScale(item[xDataKey]),
    yScale(item[dataKey]),
  ]))

  const line = d3Shape
    .line()
    .curve(d3Shape.curveCardinal.tension(0.5))
  const path = line(points)
  return (
    <React.Fragment>
      <Path
        transform={`translate(${bandwidth / 2}, 0)`}
        d={path}
        options={options}
      />
      {points.map(([x, y], index) => (
        <Circle
          transform={`translate(${bandwidth / 2}, 0)`}
          x={x}
          y={y}
          key={index}
          diameter={10}
          options={{
            ...options,
            fill: options.stroke,
            fillStyle: 'solid',
          }}
        />
      ))}
    </React.Fragment>
  )
}

LineSeries.displayName = 'LineSeries'

export default LineSeries