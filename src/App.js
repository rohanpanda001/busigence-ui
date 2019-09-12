import React, { Component } from "react";
import axios from "axios";
import { Draggable } from "react-drag-and-drop";
import { DragIndicator } from "@material-ui/icons";
import { Grid, Step, Stepper, StepLabel } from "@material-ui/core";
import {
  Radio,
  Row,
  message,
  Col,
  Button,
  Icon,
  Upload,
  Input,
  Collapse,
  Table,
  Checkbox,
  Modal
} from "antd";
import "./App.css";
import Visualize from "./Visualize";
import { params } from "./utils/utils";

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
      showTable: false,
      joinType: "inner",
      sortOrder: "asc"
    };
  }

  getColumns = table => {
    let tableKeys = [];
    if (table === "customers") {
      tableKeys = ["CustomerID", "CompanyName", "ContactName", "ContactTitle"];
    } else if (table === "orders") {
      tableKeys = [
        "OrderID",
        "CustomerID",
        "EmployeeID",
        "OrderDate",
        "RequiredDate",
        "ShippedDate",
        "ShipVia",
        "Freight"
      ];
    }
    return tableKeys.map(x => ({ title: x, dataIndex: x, key: x }));
  };

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

  onChange(info) {
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    console.log(info);
  }

  renderCSV = () => {
    return (
      <div style={{ paddingTop: 20 }}>
        <Upload
          name="file"
          action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
          onChange={this.onChange}
        >
          <Button>
            <Icon type="upload" /> Click to Upload
          </Button>
        </Upload>
      </div>
    );
  };

  onDBOpen = async activeDB => {
    if (activeDB) {
      const response = await axios({
        ...params.post,
        url: `${API_URL}showTables`,
        data: { db: activeDB }
      });
      const { data: tables = [] } = response;
      this.setState({ tables: tables.map(table => table[0]) });
    }
  };

  renderHeader = table => {
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
                await this.onTableOpen();
                this.setState({ showTable: true });
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
      const columns = this.getColumns(table);
      const { data: rows = [] } = response;
      const modifiedRows = rows.map(row => {
        return row.reduce((acc, field, index) => {
          const { [index]: { key } = {} } = columns;
          acc[key] = field;
          return acc;
        }, {});
      });
      const tableKeys = Object.keys(modifiedRows[0]);
      this.setState({
        currentTable: table,
        columns,
        rows: modifiedRows,
        tableKeys
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

  render() {
    const {
      format,
      databases,
      tables = [],
      showTable,
      selectedElements = {},
      activeStep,
      rows = [],
      columns = [],
      tableKeys = []
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
              <Col span={12}>
                {databases ? (
                  <div style={defaultPadding}>
                    <Collapse accordion onChange={this.onDBOpen}>
                      {databases.map(db => (
                        <Panel header={db} key={db}>
                          <span>Tables: </span>
                          <Collapse accordion onChange={this.onTableOpen}>
                            {tables.map(table => {
                              const {
                                [table]: checklist = []
                              } = selectedElements;
                              return (
                                <Panel
                                  header={this.renderHeader(table)}
                                  key={table}
                                >
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
                  </div>
                ) : null}
              </Col>
            </Row>
          </Col>
          <Col span={12} style={{ paddingLeft: 50 }}>
            <Visualize
              selectedElements={selectedElements}
              tables={tables}
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
