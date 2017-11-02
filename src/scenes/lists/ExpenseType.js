import { autobind } from "core-decorators";
import Entity, { EntityData } from "./Entity";
import DB from "../../DB";

const strings = require("../../strings")("expenseType");

@autobind
export default class ExpenseType extends Entity {
   constructor(props) {
      super(
         props,
         "ExpenseType",
         DB.addUpdateExpenseType,
         new EntityData("type", strings.type),
         new EntityData("code", strings.code, 10));
   }
}
