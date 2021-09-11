import _ from "lodash";
export default class GroupedCollection {
  protected data: [][];
  public constructor(data: [][]) {
    this.data = data;
  }
  /**
   * gets total number of object instances in given collection
   */
  public count(): number {
    return this.data.reduce((count, group) => {
      count += group.length;
      return count;
    }, 0);
  }

  /**
   * gets max number of instances on any given granularity (e.g. max in one day, one week, etc.)
   */
  public max(): number {
    return this.data.reduce((max, group) => {
      max = group.length > max ? group.length : max;
      return max;
    }, 0);
  }

  /**
   * gets sum of column/field/property in collection
   * @param property
   */
  public sum(property: string): number {
    return this.data.reduce((sum, group) => {
      group.forEach((member: any) => {
        if (_.get(member, `${property}`)) {
          sum += _.get(member, `${property}`) || 0;
        }
      });
      return sum;
    }, 0);
  }

  /**
   * gets avg of column/field/property in collection
   * @param property
   */
  public avg(property: string): number {
    return this.data.reduce((sum, group) => {
      group.forEach((member: any) => {
        if (_.get(member, `${property}`)) {
          sum += _.get(member, `${property}`) || 0;
        }
      });
      return sum / group.length;
    }, 0);
  }

  public toArray(): [][] {
    return this.data;
  }
}
