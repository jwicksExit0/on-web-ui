'use strict';

/* eslint-disable no-unused-vars */
import React, { Component, PropTypes } from 'react';
import decorate from 'common-web-ui/lib/decorate';
/* eslint-enable no-unused-vars */

import ConfirmDialog from 'common-web-ui/views/dialogs/Confirm';

@decorate({
  propTypes: {
    active: PropTypes.bool,
    model: PropTypes.any
  },
  defaultProps: {
    active: false,
    model: null
  },
  contextTypes: {
    graphCanvas: PropTypes.any
  }
})
export default class GCLinkElement extends Component {

  get graphCanvas() {
    return this.context.graphCanvas;
  }

  state = {hover: false};
  removeLink = this.removeLink.bind(this);

  render() {
    try {
      var props = this.props,
          gutter = 5,
          stroke = 3,
          style = props.model.data.bounds.css;
      style.top -= gutter;
      style.left -= gutter;
      style.width += gutter + gutter;
      style.height += gutter + gutter;

      var dir = props.model.data.bounds.dir,
          minX = 0 + gutter,
          minY = 0 + gutter,
          maxX = style.width - gutter,
          maxY = style.height - gutter,
          halfX = style.width / 2,
          halfY = style.height / 2,
          hover = this.state.hover ? 'hover ' : '',
          path = '';

      if (!isFinite(halfX)) { halfX = 0; }
      if (!isFinite(halfY)) { halfY = 0; }

      if (dir.x === 1 && dir.y === 1) {
        path = ['M', maxX, maxY, 'Q', halfX, maxY, halfX, halfY, 'T', minX, minY].join(' ');
      }
      else if (dir.x === -1 && dir.y === -1) {
        path = ['M', minX, minY, 'Q', halfX, minY, halfX, halfY, 'T', maxX, maxY].join(' ');
      } else if (dir.x === 1 && dir.y === -1) {
        path = ['M', minX, maxY, 'Q', halfX, maxY, halfX, halfY, 'T', maxX, minY].join(' ');
      }
      else if (dir.x === -1 && dir.y === 1) {
        path = ['M', maxX, minY, 'Q', halfX, minY, halfX, halfY, 'T', minX, maxY].join(' ');
      }

      var //transform = 'translate(' + style.left + ' ' + style.top + ')',
          socket = this.props.model.socketOut || this.props.model.socketIn,
          color = socket && socket.port && socket.port.color || 'black';

      // style={{overflow: 'visible'}}
      // <g transform={transform}>
      return (
        <svg
            className={'GraphCanvasLink ' + hover}
            width={style.width}
            height={style.height}
            data-id={props.model.id}
            x={style.left}
            y={style.top}
            onDoubleClick={this.removeLink}
            viewBox={[
              minX - gutter, minY - gutter,
              maxX + gutter, maxY + gutter
            ].join(' ')}
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg">
          <path
              d={path}
              fill="transparent"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              onMouseOver={this.onHoverCurve.bind(this)}
              onMouseMove={this.onHoverCurve.bind(this)}
              onMouseOut={this.onLeaveCurve.bind(this)} />
        </svg>
      );
    } catch (err) {
      console.error(err.stack || err);
    }
  }

  onHoverCurve() {
    this.setState({hover: true});
  }

  onLeaveCurve() {
    this.setState({hover: false});
  }

  removeLink(event) {
    var e = event.nativeEvent || event;
    e.stopPropagation();
    e.preventDefault();
    var confirmProps = {
      callback: (ok) => {
        if (ok) {
          this.graphCanvas.refs.links.removeLink(this.props.model);
        }
      },
      children: 'Are you sure you want to delete this link?',
      title: 'Confirm Delete:'
    };
    ConfirmDialog.create(confirmProps);
  }

}
