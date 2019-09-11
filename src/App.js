import React, { Component } from "react";
import axios from "axios";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import { Draggable, Droppable } from "react-drag-and-drop";
import Avatar from "@material-ui/core/Avatar";
import { lightGreen, grey } from "@material-ui/core/colors";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import ErrorIcon from "@material-ui/icons/Error";
import {
  Stepper,
  Grid,
  Typography,
  StepContent,
  CircularProgress
} from "@material-ui/core";
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
  Tag,
  Modal,
  Select
} from "antd";
import "./App.css";

const { Panel } = Collapse;
const { Option } = Select;
const CheckboxGroup = Checkbox.Group;
const defaultPadding = { padding: 10 };
const iconHeight = { height: 100, width: 100 };
const API_URL = "http://127.0.0.1:5000/";
const steps = ["Select Format", "Select Source", "Visualiser"];
const operations = [
  {
    key: "join",
    label: "Join Tables",
    description: "Select primary key for joining and type of join."
  },
  {
    key: "sort",
    label: "Sort Table",
    description: "Which field you want to sort?"
  },
  {
    key: "output",
    label: "Final Output",
    description: "Here is the final table"
  }
];
const params = {
  post: {
    method: "post",
    config: {
      headers: {
        "Content-Type": "application/json"
      }
    }
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      format: "mysql",
      selectedElements: {},
      activeStep: 0,
      showTable: false,
      joinType: "inner"
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
            <DragIndicatorIcon fontSize="small" color="disabled" />
          </span>
          <span>{table}</span>
          <span style={{ paddingLeft: 10 }}>
            <Button
              size="small"
              onClick={e => this.setState({ showTable: true })}
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
      this.setState({ currentTable: table, rows: modifiedRows });
    }
  };

  onCheckboxChange = (checklist, table) => {
    const { selectedElements = {} } = this.state;
    selectedElements[table] = checklist;
    const columns = this.getPrimaryKeyList(selectedElements);
    this.setState({ selectedElements, primaryKey: columns[0] });
  };

  getPrimaryKeyList = selectedElements => {
    const { selectedTables = {} } = this.state;
    const firstTable = selectedTables[1];
    const secondTable = selectedTables[2];

    const {
      [firstTable]: firstTableKeys = [],
      [secondTable]: secondTableKeys = []
    } = selectedElements;

    return firstTableKeys.filter(key => secondTableKeys.includes(key));
  };

  renderOperations = operation => {
    const { selectedElements = {}, joinLoader } = this.state;
    const columns = this.getPrimaryKeyList(selectedElements);
    const isPrimaryKeyAvailable = columns.length > 0;
    if (operation.key === "join") {
      return (
        <div>
          <div style={{ paddingTop: 10, minWidth: 100 }}>
            <span style={{ paddingRight: 10 }}>Selectjoin type</span>
            <Select
              onChange={value => this.setState({ joinType: value })}
              defaultValue="inner"
            >
              <Option value="inner">inner</Option>
              <Option value="outer">outer</Option>
            </Select>
          </div>

          {isPrimaryKeyAvailable ? (
            <div style={{ minWidth: 100 }}>
              <span style={{ paddingRight: 10 }}>Select primary key</span>
              <Select
                onChange={value => this.setState({ primaryKey: value })}
                defaultValue={columns[0]}
              >
                {columns.map(column => (
                  <Option value={column}>{column}</Option>
                ))}
              </Select>
            </div>
          ) : (
            <span
              style={{
                fontSize: 10,
                display: "flex",
                paddingTop: 5,
                paddingBottom: 5
              }}
            >
              <ErrorIcon fontSize="small" />{" "}
              <span style={{ paddingLeft: 5, alignSelf: "center" }}>
                No common keys found{" "}
              </span>
            </span>
          )}

          <div>
            <Button
              type="primary"
              disabled={!isPrimaryKeyAvailable}
              onClick={() =>
                this.setState({ joinLoader: true }, () => {
                  setTimeout(() => {
                    this.joinTable();
                    this.setState({ joinLoader: false });
                  }, 2000);
                })
              }
              style={{ marginTop: 5 }}
            >
              Join
            </Button>
            {joinLoader && (
              <div style={{ marginTop: 20 }}>
                <CircularProgress />
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  renderVisualize = () => {
    const {
      selectedElements = {},
      tables = [],
      selectedTables = {},
      activeOperation
    } = this.state;
    if (!tables.length) {
      return null;
    }

    const firstTable = selectedTables[1];
    const secondTable = selectedTables[2];

    const {
      [firstTable]: firstTableKeys = [],
      [secondTable]: secondTableKeys = []
    } = selectedElements;

    return (
      <div>
        <Row style={{ height: 250 }}>
          <Col span={12}>
            <Row>
              <Droppable
                types={["table"]}
                onDrop={({ table }) =>
                  this.setState({
                    selectedTables: { ...selectedTables, 1: table }
                  })
                }
              >
                <Avatar
                  style={{
                    ...iconHeight,
                    backgroundColor: firstTable ? lightGreen[500] : grey,
                    color: "#fff"
                  }}
                >
                  {firstTable || "Table 1"}
                </Avatar>
              </Droppable>
            </Row>
            <Row>
              {firstTable ? (
                <div style={{ marginTop: 10 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Keys:
                  </Typography>
                  {firstTableKeys.length
                    ? firstTableKeys.map(key => <Tag>{key}</Tag>)
                    : "-"}
                </div>
              ) : null}
            </Row>
          </Col>
          <Col span={12}>
            <Droppable
              types={["table"]}
              onDrop={({ table }) =>
                this.setState({
                  selectedTables: { ...selectedTables, 2: table }
                })
              }
            >
              <Avatar
                style={{
                  ...iconHeight,
                  backgroundColor: secondTable ? lightGreen[500] : grey,
                  color: "#fff"
                }}
              >
                {secondTable || "Table 2"}
              </Avatar>
            </Droppable>
            {secondTable ? (
              <div style={{ marginTop: 10 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Keys
                </Typography>
                {secondTableKeys.length
                  ? secondTableKeys.map(key => <Tag>{key}</Tag>)
                  : "-"}
              </div>
            ) : null}
          </Col>
        </Row>

        {firstTable && secondTable && Object.keys(selectedElements).length > 1 && (
          <div>
            <h3>Operations:</h3>
            <Stepper activeStep={activeOperation} orientation="vertical">
              {operations.map(operation => {
                return (
                  <Step key={operation.label}>
                    <StepLabel>{operation.label}</StepLabel>
                    <StepContent>
                      <div>
                        <Typography variant="subtitle2" gutterBottom>
                          {operation.description}
                        </Typography>
                      </div>
                      {this.renderOperations(operation)}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </div>
        )}
      </div>
    );
  };

  joinTable = async () => {
    const { selectedElements = {}, joinType, primaryKey } = this.state;
    const response = await axios({
      ...params.post,
      url: `${API_URL}proccessJoin`,
      data: {
        joinType,
        primaryKey,
        tables: selectedElements
      }
    });
    // const { data } = response;
    console.log(response);
  };

  render() {
    const {
      format,
      databases,
      tables = [],
      showTable,
      currentTable,
      rows = [],
      selectedElements = {},
      activeStep
    } = this.state;
    const columns = this.getColumns(currentTable);

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
                                  {rows.length ? (
                                    <CheckboxGroup
                                      options={Object.keys(rows[0])}
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
            {this.renderVisualize()}
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
