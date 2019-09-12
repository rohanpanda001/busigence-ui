import React from "react";
import axios from "axios";
import { lightGreen } from "@material-ui/core/colors";
import {
  Stepper,
  Typography,
  Step,
  StepLabel,
  StepContent,
  CircularProgress
} from "@material-ui/core";
import {
  getAllColumns,
  getPrimaryKeyList,
  renderInfo,
  params
} from "./utils/utils";
import { Button, Select } from "antd";
import { CheckCircle, Error } from "@material-ui/icons";

const API_URL = "http://127.0.0.1:5000/";
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
const { Option } = Select;

export default class Operations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      joinLoader: false,
      sortLoader: false,
      joinType: "inner",
      sortOrder: "asc",
      activeOperation: 0
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { selectedElements = {}, selectedTables = {} } = nextProps;
    const columns = getAllColumns(selectedElements);
    const primaryKeys = getPrimaryKeyList(selectedElements, selectedTables);
    const { primaryKey, sortKey } = prevState;
    if (primaryKey !== primaryKeys[0] || sortKey !== columns[0]) {
      return {
        primaryKey: primaryKeys[0],
        sortKey: columns[0]
      };
    }

    return null;
  }

  applySort = async () => {
    const { finalJoinValue = [], sortKey, sortOrder } = this.state;
    const response = await axios({
      ...params.post,
      url: `${API_URL}proccessSort`,
      data: {
        sortKey,
        isAscending: sortOrder === "asc",
        tableData: finalJoinValue
      }
    });
    const { data } = response;
    const rows = Object.keys(data).map(x => data[x]);
    this.setState({ finalSortValue: rows });
  };

  joinTable = async () => {
    const { joinType, primaryKey } = this.state;
    const { selectedElements = {} } = this.props;
    const response = await axios({
      ...params.post,
      url: `${API_URL}proccessJoin`,
      data: {
        joinType,
        primaryKey,
        tables: selectedElements
      }
    });
    const { data } = response;
    const rows = Object.keys(data).map(x => data[x]);
    this.setState({ finalJoinValue: rows });
  };

  renderOperation = operation => {
    const {
      selectedElements = {},
      showTable,
      selectedTables = {}
    } = this.props;
    const {
      joinLoader,
      sortLoader,
      finalJoinValue = [],
      finalSortValue = []
    } = this.state;
    const columns = getAllColumns(selectedElements);
    const primaryKeys = getPrimaryKeyList(selectedElements, selectedTables);
    const isPrimaryKeyAvailable = primaryKeys.length > 0;
    if (operation.key === "join") {
      return (
        <div>
          <div style={{ paddingTop: 10, minWidth: 100 }}>
            <span style={{ paddingRight: 10 }}>Select join type</span>
            <Select
              onChange={value => this.setState({ joinType: value })}
              defaultValue="inner"
            >
              <Option value="inner">inner</Option>
              <Option value="outer">outer</Option>
            </Select>
          </div>

          {isPrimaryKeyAvailable ? (
            <div style={{ paddingTop: 10, minWidth: 100 }}>
              <span style={{ paddingRight: 10 }}>Select primary key</span>
              <Select
                onChange={value => this.setState({ primaryKey: value })}
                defaultValue={primaryKeys[0]}
              >
                {primaryKeys.map(column => (
                  <Option value={column}>{column}</Option>
                ))}
              </Select>
            </div>
          ) : (
            renderInfo({
              message: "No common keys found",
              icon: <Error color="danger" fontSize="small" />
            })
          )}

          <div style={{ paddingTop: 10 }}>
            <Button
              type="primary"
              disabled={!isPrimaryKeyAvailable}
              onClick={() =>
                this.setState({ joinLoader: true, finalJoinValue: [] }, () => {
                  setTimeout(() => {
                    this.joinTable();
                    this.setState({ joinLoader: false });
                  }, 2000);
                })
              }
            >
              Join
            </Button>
            {joinLoader && (
              <div style={{ marginTop: 20 }}>
                <CircularProgress />
              </div>
            )}

            {!!finalJoinValue.length && (
              <div>
                {renderInfo({
                  message: "Join Successful",
                  icon: <CheckCircle color="action" fontSize="small" />
                })}
                <div style={{ paddingTop: 5 }}>
                  <Button
                    type="primary"
                    onClick={() => this.setState({ activeOperation: 1 })}
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() =>
                      showTable({ table: finalJoinValue, columns })
                    }
                    style={{ marginLeft: 10 }}
                  >
                    Show Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else if (operation.key === "sort") {
      return (
        <div>
          <div style={{ paddingTop: 10 }}>
            <span style={{ paddingRight: 10 }}>Select sort field</span>
            <Select
              onChange={value => this.setState({ sortKey: value })}
              defaultValue={columns[0]}
            >
              {columns.map(column => (
                <Option value={column}>{column}</Option>
              ))}
            </Select>
          </div>
          <div style={{ paddingTop: 10 }}>
            <span style={{ paddingRight: 10 }}>Select sort order</span>
            <Select
              onChange={value => this.etState({ sortOrder: value })}
              defaultValue="asc"
            >
              <Option value={"asc"}>ASC</Option>
              <Option value={"desc"}>DESC</Option>
            </Select>
          </div>
          <div style={{ paddingTop: 10 }}>
            <Button
              type="primary"
              onClick={() => {
                this.setState({ sortLoader: true, finalSortValue: [] }, () => {
                  setTimeout(() => {
                    this.applySort();
                    this.setState({ sortLoader: false });
                  }, 2000);
                });
              }}
            >
              Apply Sort
            </Button>
            <Button
              onClick={() => this.setState({ activeOperation: 0 })}
              style={{ marginLeft: 10 }}
            >
              Back
            </Button>
          </div>
          {sortLoader && (
            <div style={{ marginTop: 20 }}>
              <CircularProgress />
            </div>
          )}
          {!!finalSortValue.length && (
            <div>
              {renderInfo({
                message: "Sort Successful",
                icon: <CheckCircle color="action" fontSize="small" />
              })}
              <div style={{ paddingTop: 5 }}>
                <Button
                  type="primary"
                  onClick={() => this.setState({ activeOperation: 2 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (operation.key === "output") {
      return (
        <div style={{ marginTop: 10 }}>
          <Button
            type="primary"
            onClick={() => showTable({ table: finalSortValue, columns })}
          >
            See final Output
          </Button>
          <Button
            onClick={() => this.setState({ activeOperation: 1 })}
            style={{ marginLeft: 10 }}
          >
            Back
          </Button>
        </div>
      );
    }
  };

  render() {
    const { activeOperation } = this.state;
    console.log(activeOperation);
    return (
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
                  {this.renderOperation(operation)}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </div>
    );
  }
}
