import React, { Component } from 'react';
import axios from 'axios';
import { Radio, Row, message, Col, Button, Icon, Upload, Input, Collapse, Table, Checkbox, Tag } from 'antd';
import './App.css';

const { Panel } = Collapse;
const CheckboxGroup = Checkbox.Group;
const defaultPadding = { padding: 10 };
const API_URL = 'http://127.0.0.1:5000/';

class App extends Component {
  constructor(props) {
    super(props);
    this.state =  {
      format: 'mysql',
      seletedElements: {},
    }
  }

  getColumns = table => {
    let tableKeys = [];
    if (table === 'customers') {
      tableKeys = ['CustomerID','CompanyName','ContactName','ContactTitle'];
    } else if (table === 'orders') {
      tableKeys = ['OrderID','CustomerID','EmployeeID','OrderDate','RequiredDate','ShippedDate','ShipVia','Freight'];
    }
    return tableKeys.map(x => ({ title: x, dataIndex: x, key: x}));
  }

  submitMysql = async () => {
    const response = await axios.post(`${API_URL}showDatabases`);
    const { data: databases = [] } = response;
    this.setState({ databases: databases.map(db => db[0]) });
  }

  renderMysql = () => {
    return (
      <div style={{width: 200}}>
        <Input placeholder="Username" onChange={e => this.setState({ username: e.target.value})} style={{marginTop: 5}} />
        <Input placeholder="Password" onChange={e => this.setState({ password: e.target.value})} style={{marginTop: 5}} />
        <Input placeholder="IP Address" onChange={e => this.setState({ ip: e.target.value})} style={{marginTop: 5}} />
        <Button type="primary" onClick={this.submitMysql} style={{marginTop: 5}}>Submit</Button>
      </div>
    );
  }

  onChange(info) {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
    console.log(info)
  }

  renderCSV = () => {
    return (
      <div style={{ paddingTop: 20}}>
        <Upload name='file' action='https://www.mocky.io/v2/5cc8019d300000980a055e76' onChange={this.onChange}>
          <Button>
            <Icon type="upload" /> Click to Upload
          </Button>
        </Upload>
      </div>
    );
  }

  onDBOpen = async activeDB => {
    if (activeDB) {
      var data = new FormData();
      data.set("db", activeDB);
      const response = await axios({
        method: 'post',
        url: `${API_URL}showTables`,
        data,
        config: { headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'multipart/form-data', "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"}}
      });
      const { data: tables = [] } = response;
      this.setState({ tables: tables.map(table => table[0]) })
    }
  }

  renderHeader = table => {
    return <div>
      <span>{table}</span>
      <span style={{paddingLeft: 10}}>
        <Button onClick={(e) => {
          e.stopPropagation();
          this.setState({ showTable: true}, () => this.onTableOpen(table))
        }}>Preview</Button>
      </span>
    </div>;
  }

  onTableOpen = async table => {
    const { currentTable } = this.state;
    if (table && currentTable !== table) {
      var data = new FormData();
      data.set("table", table);
      const response = await axios({
        method: 'post',
        url: `${API_URL}showRows`,
        data,
        config: { headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'multipart/form-data', "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"}}
      });
      const columns = this.getColumns(table);
      const { data: rows = [] } = response;
      const modifiedRows = rows.map(row => {
        return row.reduce((acc, field, index) => {
          const { [index]: { key } = {} } = columns
          acc[key] = field;
          return acc;
        }, {});
      })
      this.setState({ currentTable: table, rows: modifiedRows });
    }
  }

  onCheckboxChange = (checklist, table) => {
    const { seletedElements = {} } = this.state;
    seletedElements[table] = checklist;
    this.setState({ seletedElements });
  }

  renderVisualize = () => {
    const { seletedElements = {} } = this.state;
    const canVisualize = Object.keys(seletedElements).filter(x => seletedElements[x].length).length

    if (!canVisualize) return null;

    const tables = Object.keys(seletedElements);
    return <div style={defaultPadding}>
      {tables.map(table => {
        return <div>
          <strong>{table}</strong>: {seletedElements[table].map(field => <Tag>{field}</Tag>)}
        </div>
      })}
      { tables.length > 1 ? <Button type="primary" onClick={this.joinTable}>JOIN</Button> : null}
    </div>
  }

  joinTable = async () => {
    const { seletedElements = {} } = this.state;
    const response = await axios({
      method: 'post',
      url: `${API_URL}proccessJoin`,
      data: {
        join_type: 'inner',
        tables: seletedElements,
      },
      config: { headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"}}
    });
    // const { data } = response;
    console.log( response )
  }
  
  render() {
    const { format, databases, tables = [], showTable, currentTable, rows = [], seletedElements = {} } = this.state; 
    const columns = this.getColumns(currentTable);
    
    return (
      <div style={{ padding: 50 }}>
          <Col span={12}>
            <Row>
              <Col span={12}>
                <h3>1. Select Format</h3>
                <div style={defaultPadding}>
                  <Radio.Group onChange={e => this.setState({ format: e.target.value })} value={format}>
                    <Radio value='mysql'>Mysql</Radio>
                    <Radio value='csv'>CSV</Radio>
                  </Radio.Group>
                  <div style={{ paddingTop: 5, minHeight: 200}}>
                    {format === 'mysql' && this.renderMysql()}
                    {format === 'csv' && this.renderCSV()}
                  </div>
                </div>
              </Col>
              <Col span={12}>
              <h3>2. Select Source</h3>
              {databases ? 
                <div style={defaultPadding}>
                  <Collapse accordion onChange={this.onDBOpen}>
                    {databases.map(db => 
                      <Panel header={db} key={db}>
                      <span>Tables: </span>
                        <Collapse accordion onChange={this.onTableOpen}>
                          {tables.map(table => {
                            const { [table]: checklist = [] } = seletedElements;
                            return <Panel header={this.renderHeader(table)} key={table}>
                               { rows.length ? <CheckboxGroup
                                options={Object.keys(rows[0])}
                                value={checklist}
                                onChange={(list) => this.onCheckboxChange(list, table)}
                              /> : null }
                            </Panel>
                          })}
                        </Collapse>
                      </Panel>
                    )}
                  </Collapse>
                </div>
              : null }
              </Col>
            </Row>
            <Row>
            <h3>4. Preview</h3>
            { showTable && <Table dataSource={rows} columns={columns} />}
            </Row>
          </Col>
          <Col span={12}>
            <h3>3. Visualizer</h3>
            {this.renderVisualize()}
          </Col>
      </div>
    );;
  }
}

export default App;
