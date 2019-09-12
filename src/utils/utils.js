import React from "react";

export const params = {
  post: {
    method: "post",
    config: {
      headers: {
        "Content-Type": "application/json"
      }
    }
  }
};

export const getAllColumns = selectedElements => {
  const columnList = Object.keys(selectedElements).reduce((acc, key) => {
    return [...acc, ...selectedElements[key]];
  }, []);
  const columnSet = new Set(columnList);
  return Array.from(columnSet);
};

export const getPrimaryKeyList = (selectedElements, selectedTables) => {
  const firstTable = selectedTables[1];
  const secondTable = selectedTables[2];

  const {
    [firstTable]: firstTableKeys = [],
    [secondTable]: secondTableKeys = []
  } = selectedElements;

  return firstTableKeys.filter(key => secondTableKeys.includes(key));
};

export const renderInfo = ({ icon, message }) => (
  <span
    style={{
      fontSize: 10,
      display: "flex",
      paddingTop: 10,
      paddingBottom: 10
    }}
  >
    {icon}
    <span style={{ paddingLeft: 5, alignSelf: "center" }}>{message}</span>
  </span>
);
