import React, { Component } from "react";
import axios from "axios";
import { Draggable } from "react-drag-and-drop";
import { DragIndicator } from "@material-ui/icons";
import ReactFileReader from "react-file-reader";
import { Grid, Step, Stepper, StepLabel } from "@material-ui/core";
import {
  Radio,
  Row,
  Col,
  Button,
  Icon,
  Input,
  Collapse,
  Table,
  Checkbox,
  Modal
} from "antd";
import "./App.css";
import Visualize from "./Visualize";
import { params, processData, getRows } from "./utils/utils";

const { Panel } = Collapse;

const CheckboxGroup = Checkbox.Group;
const defaultPadding = { padding: 10 };
const API_URL = "http://127.0.0.1:5000/";
const steps = ["Select Format", "Select Source", "Visualiser"];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      format: "mysql",
      selectedElements: {},
      activeStep: 0,
      showTable: false
    };
  }

  submitMysql = async () => {
    const response = await axios.post(`${API_URL}showDatabases`);
    const { data: databases = [] } = response;
    this.setState({ databases: databases.map(db => db[0]), activeStep: 1 });
  };

  renderMysql = () => {
    return (
      <div style={{ width: 200 }}>
        <Input
          placeholder="Username"
          value="root"
          onChange={e => this.setState({ username: e.target.value })}
          style={{ marginTop: 5 }}
        />
        <Input
          placeholder="Password"
          value=""
          onChange={e => this.setState({ password: e.target.value })}
          style={{ marginTop: 5 }}
        />
        <Input
          placeholder="IP Address"
          value="127.0.0.1"
          onChange={e => this.setState({ ip: e.target.value })}
          style={{ marginTop: 5 }}
        />
        <Button
          type="primary"
          onClick={this.submitMysql}
          style={{ marginTop: 5 }}
        >
          Submit
        </Button>
      </div>
    );
  };

  renderCSV = () => {
    return (
      <div style={{ paddingTop: 20 }}>
        <ReactFileReader handleFiles={this.handleFiles} fileTypes={".csv"}>
          <Button type="dashed">
            <Icon type="upload" style={{ paddingRight: 5 }} />
            Upload
          </Button>
        </ReactFileReader>
      </div>
    );
  };

  handleFiles = files => {
    const { importedTables = [], importedTableData = {} } = this.state;
    const file = files[0];
    const fileName = file.name.split(".")[0];
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target.result;
      const lines = processData(result);
      const columns = lines[0];
      const data = lines.slice(1);
      const rows = getRows(data, columns);
      importedTableData[fileName] = rows;
      this.setState({
        importedTables: [...importedTables, fileName],
        importedTableData,
        canVisualize: Object.keys(importedTableData).length > 1
      });
    };
    reader.readAsText(file);
  };

  onDBOpen = async activeDB => {
    if (activeDB) {
      const response = await axios({
        ...params.post,
        url: `${API_URL}showTables`,
        data: { db: activeDB }
      });
      const { data = [] } = response;
      const tables = data.map(table => table[0]);
      this.setState({
        tables,
        canVisualize: tables.length > 1,
        activeStep: tables.length > 1 ? 2 : 1
      });
    }
  };

  renderHeader = table => {
    const {
      format,
      importedTableData: { [table]: tableData } = {}
    } = this.state;
    return (
      <Draggable type="table" data={table}>
        <Grid container direction="row">
          <span>
            <DragIndicator fontSize="small" color="disabled" />
          </span>
          <span>{table}</span>
          <span style={{ paddingLeft: 10 }}>
            <Button
              size="small"
              onClick={async () => {
                if (format === "mysql") {
                  await this.onTableOpen();
                  this.setState({ showTable: true });
                } else {
                  const columns = Object.keys(tableData[0]);
                  this.setState({
                    showTable: true,
                    rows: tableData,
                    columns: columns.map(x => ({
                      title: x,
                      dataIndex: x,
                      key: x
                    }))
                  });
                }
              }}
            >
              Preview
            </Button>
          </span>
        </Grid>
      </Draggable>
    );
  };

  onTableOpen = async table => {
    const { currentTable } = this.state;
    if (table && currentTable !== table) {
      const response = await axios({
        ...params.post,
        url: `${API_URL}showRows`,
        data: { table }
      });
      const columnResponse = await axios({
        ...params.post,
        url: `${API_URL}showColumns`,
        data: { table }
      });
      const columns = columnResponse.data.map(column => column[0]);
      const { data = [] } = response;
      const rows = getRows(data, columns);
      this.setState({
        currentTable: table,
        columns: columns.map(x => ({ title: x, dataIndex: x, key: x })),
        rows,
        tableKeys: columns
      });
    }
  };

  onCheckboxChange = (checklist, table) => {
    const { selectedElements = {} } = this.state;
    selectedElements[table] = checklist;
    this.setState({
      selectedElements
    });
  };

  importedTableChange = table => {
    if (table) {
      const { importedTableData } = this.state;
      const { [table]: tableData = [] } = importedTableData;
      const tableKeys = Object.keys(tableData[0]);
      this.setState({ tableKeys });
    }
  };

  renderSource = () => {
    const {
      databases,
      tableKeys = [],
      selectedElements = {},
      importedTables = [],
      format,
      tables = [],
      importedTableData = {}
    } = this.state;
    return (
      <div style={defaultPadding}>
        {format === "mysql" && databases ? (
          <Collapse accordion onChange={this.onDBOpen}>
            {databases.map(db => (
              <Panel header={db} key={db}>
                <span>Tables: </span>
                <Collapse accordion onChange={this.onTableOpen}>
                  {tables.map(table => {
                    const { [table]: checklist = [] } = selectedElements;
                    return (
                      <Panel header={this.renderHeader(table)} key={table}>
                        {tableKeys.length ? (
                          <CheckboxGroup
                            options={tableKeys}
                            value={checklist}
                            onChange={list =>
                              this.onCheckboxChange(list, table)
                            }
                          />
                        ) : null}
                      </Panel>
                    );
                  })}
                </Collapse>
              </Panel>
            ))}
          </Collapse>
        ) : format === "csv" && Object.keys(importedTableData).length ? (
          <div>
            <span>Tables imported</span>
            <Collapse accordion onChange={this.importedTableChange}>
              {importedTables.map(table => {
                const { [table]: checklist = [] } = selectedElements;
                return (
                  <Panel header={this.renderHeader(table)} key={table}>
                    {tableKeys.length ? (
                      <CheckboxGroup
                        options={tableKeys}
                        value={checklist}
                        onChange={list => this.onCheckboxChange(list, table)}
                      />
                    ) : null}
                  </Panel>
                );
              })}
            </Collapse>
          </div>
        ) : null}
      </div>
    );
  };

  render() {
    const {
      format,
      showTable,
      selectedElements = {},
      activeStep,
      rows = [],
      columns = [],
      canVisualize,
      importedTableData = {}
    } = this.state;

    return (
      <div style={{ padding: 50 }}>
        <div style={{ width: "80%" }}>
          <Stepper activeStep={activeStep}>
            {steps.map(label => {
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </div>
        <Row>
          <Col span={12}>
            <Row>
              <Col span={12}>
                <div style={defaultPadding}>
                  <Radio.Group
                    onChange={e => this.setState({ format: e.target.value })}
                    value={format}
                  >
                    <Radio value="mysql">Mysql</Radio>
                    <Radio value="csv">CSV</Radio>
                  </Radio.Group>
                  <div style={{ paddingTop: 5, minHeight: 200 }}>
                    {format === "mysql" && this.renderMysql()}
                    {format === "csv" && this.renderCSV()}
                  </div>
                </div>
              </Col>
              <Col span={12}>{this.renderSource()}</Col>
            </Row>
          </Col>
          <Col span={12} style={{ paddingLeft: 50 }}>
            <Visualize
              selectedElements={selectedElements}
              canVisualize={canVisualize}
              importedTableData={importedTableData}
              format={format}
              showTable={({ table, columns = columns }) =>
                this.setState({
                  showTable: true,
                  rows: table,
                  columns: columns.map(column => ({
                    title: column,
                    dataIndex: column,
                    key: column
                  }))
                })
              }
            />
          </Col>
        </Row>
        <Modal
          title="Data Preview"
          visible={showTable}
          onOk={() => this.setState({ showTable: false })}
          onCancel={() => this.setState({ showTable: false })}
          width={700}
        >
          <div style={{ ...defaultPadding, overflow: "scroll" }}>
            <Table dataSource={rows} columns={columns} size="sm" />
          </div>
        </Modal>
      </div>
    );
  }
}

export default App;
