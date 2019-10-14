/* eslint-disable no-case-declarations */
import * as React from 'react'
import { RoughSVG } from 'roughjs/src/svg'
import * as d3Shape from 'd3-shape'
import { useShallowEqual } from './useShallowEqual'
import { Context } from './components/Context'
import { BaseOptions, RoughOptions } from './baseTypes'
import { loopHandlers } from './utils'

export type DrawFunction = 'line' | 'rectangle' | 'ellipse' | 'circle' | 'linearPath' | 'polygon' | 'arc' | 'curve' | 'path'

const createSvgNode = (tagName: string, attributes: any): SVGGElement => {
  const common = {
    opacity: '0',
    fill: 'black',
    stroke: 'black',
  }
  let attrs = {
    ...common,
    ...attributes,
  }
  const nsString = 'http://www.w3.org/2000/svg'
  let newTagName = tagName
  if (tagName === 'arc') {
    newTagName = 'path'
    const arc = d3Shape.arc()
    const {
      innerRadius, outerRadius, startAngle, endAngle, x, y, ...rest
    } = attrs
    const d = arc({
      innerRadius: innerRadius || 0,
      outerRadius: outerRadius || 0,
      startAngle: startAngle || 0,
      endAngle: endAngle || 0,
    })
    attrs = {
      ...attrs,
      ...rest,
      d,
      transform: `translate(${x}, ${y})`,
    }
  }
  const node = document.createElementNS(nsString, newTagName)
  Object.keys(attrs).forEach((attrName) => {
    node.setAttribute(attrName, attrs[attrName])
  })
  return node as any
}
export function useDrawEffect<T extends DrawFunction>(
  drawFnName: T, deps: Parameters<RoughSVG[T]>, props: BaseOptions = {},
) {
  const value = React.useContext(Context)
  const nodeRef = React.useRef<SVGGElement>(null)
  const fakeNodeRef = React.useRef<SVGGElement>(null)

  if (!value) {
    throw Error('Wrap Component inside <RoughProvider>')
  }
  const creteFakeNode = () => {
    switch (drawFnName) {
      case 'rectangle':
        return createSvgNode('rect', {
          x: deps[0],
          y: deps[1],
          width: deps[2],
          height: deps[3],
        })
      case 'path':
        const pathOptions = (deps[1] || {}) as RoughOptions
        return createSvgNode('path', {
          d: deps[0],
          fill: pathOptions.fill ? 'black' : 'none',
        })
      default:
        const options = (deps[deps.length - 1] || {})
        const newOptions: RoughOptions = {
          ...(options as any),
          fill: 'black',
          fillStyle: 'solid',
        }
        const args = [...deps.slice(0, deps.length - 1), newOptions]
        const node = (value.rough[drawFnName as any](...args as any) as SVGGElement)
        node.setAttribute('opacity', '0')
        return node
    }
  }
  const {
    transform, opacity, onClick, onMouseOut, onMouseOver,
    cursor, strokeDasharray, onMouseMove,
  } = props
  const handlers = {
    onClick, onMouseOut, onMouseOver, onMouseMove,
  }
  const setAttribute = (node: SVGGElement, attrs: object) => {
    Object.keys(attrs).forEach((attrName) => {
      if (attrName === 'strokeDasharray') {
        node.setAttribute('stroke-dasharray', attrs[attrName])
        return
      }
      if (attrs[attrName] !== undefined) {
        node.setAttribute(attrName, attrs[attrName])
      }
    })
  }

  // Style Effect
  React.useEffect(() => {
    if (nodeRef.current) {
      setAttribute(nodeRef.current, {
        transform,
        opacity,
        cursor,
        strokeDasharray,
      })
    }
    if (fakeNodeRef.current) {
      setAttribute(fakeNodeRef.current, {
        transform,
      })
    }
  }, [transform, opacity, cursor, strokeDasharray])
  useShallowEqual(() => {
    if (value.root) {
      const node = (value.rough[drawFnName as any](...deps as any) as SVGGElement)
      nodeRef.current = node
      const fakeNode = creteFakeNode()
      fakeNodeRef.current = fakeNode
      setAttribute(node, {
        transform,
        opacity,
        cursor,
        strokeDasharray,
      })
      // NOTE node will be last child of its parent. Will cause some shadowing issues
      value.root.appendChild(node)
      if (fakeNode) {
        loopHandlers(fakeNode, 'addEventListener', handlers)
        setAttribute(fakeNode, {
          transform,
          cursor,
        })
        value.root.appendChild(fakeNode)
      } else {
        loopHandlers(node, 'addEventListener', handlers)
      }
      return () => {
        nodeRef.current = null
        value.root.removeChild(node)
        if (fakeNode) {
          fakeNodeRef.current = null
          loopHandlers(fakeNode, 'removeEventListener', handlers)
          value.root.removeChild(fakeNode)
        } else {
          loopHandlers(node, 'removeEventListener', handlers)
        }
      }
    }
    return () => { }
  }, [value.root, ...deps])
  return value
}
