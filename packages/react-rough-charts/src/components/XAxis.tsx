/* eslint-disable react/no-array-index-key */
import * as React from 'react'
import { Line } from 'react-roughjs'
import { useChartContext } from '../hooks/useChartContext'
import { BaseChartComponentProps } from '../baseTypes'
import { isFunction, getBandWidth, isNil } from '../utils'

export interface XAxisProps extends BaseChartComponentProps {
  dataKey: string
  tickSize?: number
  fontSize?: number
  format?: (tick: string) => string
  tickCount?: number
  startFromY?: any
}

export const XAxis: React.FC<XAxisProps> = (props) => {
  if (!props.dataKey) {
    throw Error('dataKey of XAxisProps is required')
  }
  const {
    options, contentHeight, contentWidth, scaleData,
  } = useChartContext(props, 'xDataKey')
  const { xScale, yScale } = scaleData
  const {
    tickSize, fontSize, format, tickCount, startFromY,
  } = props
  if (!xScale || !yScale) {
    return null
  }

  const ticks = ('ticks' in xScale) ? xScale.ticks(tickCount) : xScale.domain()
  const bandwidth = getBandWidth(xScale)

  const y = isNil(startFromY) ? contentHeight : yScale(startFromY)

  return (
    <React.Fragment>
      <Line
        x1={0}
        y1={y}
        x2={contentWidth + bandwidth / 2}
        y2={y}
        options={{
          bowing: 0.2,
          ...options,
        }}
      />
      {
        ticks.map((t, index) => (
          <React.Fragment
            key={index}
          >
            <Line
              x1={xScale(t) + bandwidth / 2}
              y1={y}
              x2={xScale(t) + bandwidth / 2}
              y2={y + tickSize}
              options={{
                strokeWidth: 2,
                ...options,
              }}
            />
            <text
              x={xScale(t) + bandwidth / 2}
              y={y + tickSize + fontSize}
              stroke={options.stroke}
              fill={options.stroke}
              textAnchor="middle"
            >
              {isFunction(format) ? format(t) : String(t)}
            </text>
          </React.Fragment>
        ))
      }
    </React.Fragment>
  )
}

XAxis.displayName = 'XAxis'
XAxis.defaultProps = {
  tickSize: 10,
  fontSize: 16,
  tickCount: 10,
}

export default XAxis
