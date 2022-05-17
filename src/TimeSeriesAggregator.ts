import moment, { unitOfTime } from "moment-timezone";
import HashMap from "./HashMap";
import _ from "lodash";
import GroupedCollection from "./GroupedCollection";

export class TimeSeriesAggregator {
  protected granularity: unitOfTime.StartOf = "day"; // group by "day", "hour", "minute", "month", "year" etc.
  protected collection: object[] = []; // the collection of objects to group and
  protected period: number = 30; // number of days, hours, minutes, etc to group collection by
  protected groupBy: string = "createdAt"; // name of datetime column in the collection that we're grouping items by
  protected datetime: boolean = true; // whether to group by datetime or not
  protected HashMap: HashMap = {}; // aggregated data
  protected array: [][] = []; // aggregated data
  protected emptyMap: HashMap = {}; // empty map with time buckets
  protected groupedCollection: HashMap = {}; // grouped collection - may not include data for entire period defined
  protected timeZone: string = "UTC"; // timezone of data being passed to TimeSeriesAggregator
  protected endTime: string = moment().tz(this.timeZone).format(); // by default start time for time series HashMap is now, but this could be set to the past if you want to map historical data

  public constructor(config?: any) {
    if (config) {
      config.granularity  && this.setGranularity(config.granularity);
      config.collection?.length >= 0  && this.setCollection(config.collection) ;
      config.period && this.setPeriod(config.period);
      config.groupBy && this.setGroupBy(config.groupBy);
      config.endTime && this.setEndTime(config.endTime);
      config.datetime || this.setDatetime(config.datetime);
    }
  }

  public setDatetime(enabled: boolean) {
    this.datetime = enabled;
    return this;
  }
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
    const [keys, groupedCollection] = this.groupCollection();
    this.emptyMap = this.generateHashMap(keys);
    this.HashMap = this.mergeCollectionAndMap(groupedCollection, this.emptyMap);
    this.toArray();
    return this;
  }
  public setEndTime(date: string): TimeSeriesAggregator {
    this.endTime = moment(date).tz(this.timeZone).format();
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
    groupedcollection: HashMap,
    HashMap: HashMap
  ): HashMap {
    this.HashMap = Object.keys(HashMap).reduce((map: HashMap, key: string) => {
      map[key] = key in groupedcollection ? groupedcollection[key] : [];
      return map;
    }, {}) as HashMap;
    return this.HashMap;
  }
  protected groupCollection(): [string[], HashMap] {
    const keys: string[] = [];
    let groupedCollection = _.groupBy(this.collection, (element: object) => {
      let key: string;
      if (this.datetime) {
        key = moment(element[this.groupBy as keyof object])
          .tz(this.timeZone)
          .startOf(this.granularity)
          .format();
        keys.push(key);
        return key;
      }
      if (!this.datetime) {
        key = element[this.groupBy as keyof object];
        keys.push(key);
        return key;
      }
    });
    this.groupedCollection = groupedCollection;
    return [keys, groupedCollection];
  }
  public toArray(): [][] {
    this.array = Object.keys(this.HashMap).map((key) => {
      return this.HashMap[key];
    }) as [];
    return this.array;
  }

  public getGroupedCollection(): HashMap {
    return this.groupedCollection;
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
  protected generateHashMap(groupKeys: string[]): HashMap {
    let i = 0;
    let HashMap: HashMap = Array.from({
      length: this.datetime
        ? this.period
        : groupKeys.length < this.period
        ? groupKeys.length
        : this.period,
    }).reduce((map: HashMap): HashMap => {
      let key: string;
      if (this.datetime) {
        key = moment(this.endTime)
          .tz(this.timeZone)
          .subtract(i++, this.granularity as unitOfTime.DurationConstructor) // e.g. days
          .startOf(this.granularity) // e.g. start of day, hour, etc
          .format();
      } else {
        key = groupKeys[i++];
      }
      map[key] = [];
      return map;
    }, {}) as HashMap;
    return HashMap;
  }
  public getEndTime(): string {
    return this.endTime;
  }
  public getHashMap(): HashMap {
    return this.HashMap;
  }
}
export default TimeSeriesAggregator;
