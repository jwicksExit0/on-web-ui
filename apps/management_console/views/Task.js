// Copyright 2015, EMC, Inc.

'use strict';

import React, { Component } from 'react';

import { LinearProgress } from 'material-ui';

import JsonInspector from 'react-json-inspector';

import TaskStore from 'rui-common/stores/TaskStore';

export default class Task extends Component {

  tasks = new TaskStore();

  state = {
    task: null,
    loading: true
  };

  componentDidMount() {
    this.unwatchTask = task.watchOne('task', 'task', this);
    this.readTask();
  }

  componentWillUnmount() { this.unwatchTask(); }

  render() {
    return (
      <div className="Task">
        <LinearProgress mode={this.state.loading ? 'indeterminate' : 'determinate'} value={100} />
        <div style={{overflow: 'auto', margin: 10}}>
          <JsonInspector
              search={false}
              isExpanded={() => true}
              data={this.state.task || {}} />
        </div>
      </div>
    );
  }

  readTask() {
    this.setState({loading: true});
    this.task.read().then(() => this.setState({loading: false}));
  }

}
