import moment, { unitOfTime } from "moment-timezone";
import HashTable from "./HashTable";
import _ from "lodash";
import GroupedCollection from "./GroupedCollection";

export class TimeSeriesAggregator {
  protected granularity: unitOfTime.StartOf = "day"; // group by "day", "hour", "minute", "month", "year" etc.
  protected collection: object[] = []; // the collection of objects to group and
  protected period: number = 30; // number of days, hours, minutes, etc to group collection by
  protected groupBy: string = "createdAt"; // name of datetime column in the collection that we're grouping items by
  protected hashTable: HashTable = {}; // aggregated data
  protected array: [][] = []; // aggregated data
  protected emptyMap: HashTable = {}; // empty map with time buckets
  protected groupedCollection: HashTable = {}; // grouped collection - may not include data for entire period defined
  protected timeZone: string = "UTC"; // timezone of data being passed to TimeSeriesAggregator
  protected endTime: string = moment()
    .tz(this.timeZone)
    .format(); // by default start time for time series HashTablemap is now, but this could be set to the past if you want to map historical data

  public constructor() {}
  public setGranularity(type: unitOfTime.StartOf): TimeSeriesAggregator {
    this.granularity = type;
    return this;
  }
  public setCollection(collection: object[]): TimeSeriesAggregator {
    this.collection = collection;
    return this;
  }
  public setPeriod(period: number): TimeSeriesAggregator {
    this.period = period;
    return this;
  }
  public setGroupBy(groupBy: string): TimeSeriesAggregator {
    this.groupBy = groupBy;
    return this;
  }
  public aggregate(): TimeSeriesAggregator {
    const groupedCollection = this.groupCollection();
    this.emptyMap = this.generateHashTableMap();
    this.hashTable = this.mergeCollectionAndMap(groupedCollection, this.emptyMap);
    this.toArray();
    return this;
  }
  public setEndTime(date: string): TimeSeriesAggregator {
    this.endTime = moment(date)
      .tz(this.timeZone)
      .format();
    return this;
  }
  public setTimeZone(tz: string): TimeSeriesAggregator {
    this.timeZone = tz;
    return this;
  }
  /**
   * We have to do some filtering before we merge the groupedcollection and emptyMap willy nilly. It's possible there's timeseries data outside of this.period so we'll throw that out
   * @param groupedcollection
   * @param emptyMap
   */
  protected mergeCollectionAndMap(
    groupedcollection: HashTable,
    hashTable: HashTable,
  ): HashTable {
    this.hashTable = Object.keys(hashTable).reduce((map: HashTable, key: string) => {
      map[key] = key in groupedcollection ? groupedcollection[key] : [];
      return map;
    }, {}) as HashTable;
    return this.hashTable;
  }
  protected groupCollection(): HashTable {
    let groupedCollection = _.groupBy(this.collection, (element: object) => {
      return moment(element[this.groupBy as keyof object])
        .tz(this.timeZone)
        .startOf(this.granularity)
        .format();
    });
    this.groupedCollection = groupedCollection;
    return groupedCollection;
  }
  public toArray(): [][] {
    this.array = Object.keys(this.hashTable).map(key => {
      return this.hashTable[key];
    }) as [];
    return this.array;
  }

  /**
   * counts number of items over period
   * Slices array from start up to, but not including, end. if only one argument is passed, value from array position is returned
   */
  public count(start: number, end?: number): number {
    if (!end) {
      end = start + 1;
    }
    return _.slice(this.toArray(), start, end).reduce((count, group) => {
      count += group.length;
      return count;
    }, 0);
  }
  /**
   * selects items in from start up to, but not including, end position.
   * if only one argument is passed, value from array position is returned
   */
  public select(start: number, end?: number): GroupedCollection {
    if (!end) {
      end = start + 1;
    }
    return new GroupedCollection(_.slice(this.toArray(), start, end));
  }
  protected generateHashTableMap(): HashTable {
    let i = 0;
    let HashTableMap: HashTable = Array.from({ length: this.period }).reduce(
      (map: HashTable): HashTable => {
        let key: string = moment(this.endTime)
          .tz(this.timeZone)
          .subtract(i++, this.granularity as unitOfTime.DurationConstructor) // e.g. days
          .startOf(this.granularity) // e.g. start of day, hour, etc
          .format();
        map[key] = [];
        return map;
      },
      {},
    ) as HashTable;
    return HashTableMap;
  }
  public getEndTime(): string {
    return this.endTime;
  }
  public getHashTable(): HashTable {
    return this.hashTable;
  }
}
export default TimeSeriesAggregator;