'use strict';

/* eslint-disable no-unused-vars */
import React, { Component, PropTypes } from 'react';
import mixin from 'react-mixin';
import decorate from 'common-web-ui/lib/decorate';
import DragEventHelpers from '../../mixins/DragEventHelpers';
/* eslint-enable no-unused-vars */

import {
    Paper
  } from 'material-ui';
import GraphCanvasPort from './Group/Port.js';

import ConfirmDialog from 'common-web-ui/views/dialogs/Confirm';

@decorate({
  propTypes: {
    active: PropTypes.bool,
    canvas: PropTypes.any,
    model: PropTypes.any
  },
  defaultProps: {
    active: false,
    canvas: null,
    model: null
  },
  childContextTypes: {
    muiTheme: PropTypes.object
  }
})
@mixin.decorate(DragEventHelpers)
export default class GCGroupElement extends Component {

  state = {};
  removeGroup = this.removeGroup.bind(this);

  render() {
    if (!this.props.model || !this.props.model.bounds) {
      console.error(new Error('Invalid group').stack);
      console.log(this.props);
      return null;
    }
    var className = 'GraphCanvasGroup',
        zDepth = 2,
        bounds = this.props.model.bounds,
        style = bounds.getCSSTransform();
    style.transition =
    style.borderRadius =
    style.backgroundColor = null;
    if (this.props.active) {
      className += ' active';
    }
    else {
      style.width = Math.max(100, style.width);
      style.height = Math.max(100, style.height);
      if (bounds.min.x > bounds.max.x) {
        bounds.min.x = bounds.max.x + style.width;
      } else {
        bounds.max.x = bounds.min.x + style.width;
      }
      if (bounds.min.y > bounds.max.y) {
        bounds.min.y = bounds.max.y + style.height;
      } else {
        bounds.max.y = bounds.min.y + style.height;
      }
    }
    if (this.state.moving) {
      className += ' moving';
      zDepth = 4;
    }
    if (this.state.selected) {
      className += ' selected';
    }
    var ports = [];
    this.props.model.forEachPort(port => {
      ports.push(<GraphCanvasPort key={port.name} ref={port.name} model={port} />);
    });
    return (
      <Paper className={className}
             rounded={false}
             zDepth={zDepth}
             style={style}
             data-id={this.props.model.id}
             onClick={this.selectGroup.bind(this)}>
        <div className="container">
          <div className="header"
               onClick={this.stopEvent.bind(this)}
               onMouseDown={this.moveGroup()}>
            <span className="name">{this.props.model.data && this.props.model.data.task && this.props.model.data.task.label || 'Task Group'}</span>
            <a className="right fa fa-remove"
                onMouseDown={this.stopEvent.bind(this)}
                onClick={this.removeGroup} />
          </div>
          <div className="ports" style={{height: style.height - 16, overflow: 'auto'}} onScroll={this.onScroll.bind(this)}>
            {ports}
          </div>
        </div>
      </Paper>
    );
  }

  onScroll() {
    console.log('scroll ports');
    this.props.canvas.setState({links: this.props.canvas.fixLinkPositions()});
  }

  stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  selectGroup(event) {
    this.stopEvent(event);
    this.props.canvas.selectGroup(this.props.model, event.shiftKey);
  }

  moveGroup() {
    var pushFrame = (event, dragState) => {
      dragState.frames = dragState.frames || [];
      var index = dragState.frames.length,
          frame = {
            position: this.props.model.bounds.position,
            time: event.timeStamp || Date.now()
          },
          lastFrame = dragState.frames[index - 1] || frame,
          timeLapse = (frame.time - lastFrame.time) || 1;
      frame.velocity = lastFrame.position.sub(frame.position).squish(timeLapse).finite();
      frame.duration = timeLapse;
      dragState.frames.push(frame);
      if (dragState.frames.length >= 12) { dragState.frames.shift(); }
    };
    return this.props.canvas.setupClickDrag({
      down: (event, dragState) => {
        this.setState({moving: true});
        event.stopPropagation();
        dragState.start = event.timeStamp || Date.now();
        dragState.nextMove = -1;
        dragState.lastMove = {
          x: event.relX,
          y: event.relY
        };
        pushFrame(event, dragState);
        clearTimeout(this.physicsMoveTimer);
        this.stopPhysicsMove = true;
      },
      move: (event, dragState) => {
        clearInterval(this.moveRepeat);
        event.stopPropagation();
        var lastX = dragState.lastMove.x,
            lastY = dragState.lastMove.y;
        dragState.lastMove = {
          x: event.relX,
          y: event.relY
        };
        pushFrame(event, dragState);
        this.props.canvas.moveGroup(
          this.props.model.id,
          lastX - event.relX,
          lastY - event.relY);
        this.moveRepeat = setInterval(() => {
          pushFrame(event, dragState);
        }, 32);
      },
      up: (event, dragState) => {
        clearInterval(this.moveRepeat);
        this.setState({moving: false});
        event.stopPropagation();
        var duration = (event.timeStamp || Date.now()) - dragState.start;
        if (duration < 100) { this.selectGroup(event); }
        pushFrame(event, dragState);
        var velocitySum = dragState.frames.reduce(function (lastValue, currFrame) {
          return (lastValue.velocity || lastValue).add(currFrame.velocity);
        });
        velocitySum = velocitySum.squish(dragState.frames.length / 2);
        this.stopPhysicsMove = false;
        var tick = () => {
          if (Math.abs(velocitySum.x) < 0.000001 &&
              Math.abs(velocitySum.y) < 0.000001) { return; }
          this.props.canvas.moveGroup(
            this.props.model.id,
            velocitySum.x,
            velocitySum.y);
          velocitySum = velocitySum.scale(0.95);
          if (!this.stopPhysicsMove) {
            this.physicsMoveTimer = setTimeout(tick, 16);
          }
        };
        tick();
      }
    });
  }

  removeGroup(event) {
    event.stopPropagation();
    event.preventDefault();
    var confirmProps = {
      callback: (ok) => {
        if (ok) {
          this.props.canvas.removeGroup(this.props.model);
        }
      },
      children: 'Are you sure you want to delete this group?',
      title: 'Confirm Delete:'
    };
    ConfirmDialog.create(confirmProps);
  }

}
