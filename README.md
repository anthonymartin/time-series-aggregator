## TimeSeriesAggregator

TimeSeriesAggregator is a class that allows you aggregate time series data simply. You can group your collection by second, minutes, hours, days, weeks, months, years. When the collection is grouped, you can run calculations on the entire data set or on subsets.

Example usage:

```typescript
import TimeSeriesAggregator from "time-series-aggregator";
const aggregator = new TimeSeriesAggregator();
const data = aggregator
  .setCollection(arrayOfArbitraryData) // set the collection of objects - this is an array of objects with a datetime field e.g. [{ id: 1, date: "2019-01-14 12:53:05"}, { id: 2, date: "2019-01-13 11:23:45"}]
  .setPeriod(30) // let's map our collection over 30 days
  .setGranularity("day") // we want to group items by day
  .setGroupBy("createdAt") // let's use the createdAt column/field for grouping our collection
  .aggregate(); // do the thing
```

Select a subset of the aggregated time series data. selects grouped collection from start up to, but not including, end position of grouped array.

```typescript
const last7Days = data.select(0, 7);
```

Count the number of objects within your selected granularity:

```typescript
const last7 = data.select(0, 7).count(); // returns number of incidents over the last n days
const last14 = data.select(0, 14).count();
const last30 = data.select(0, 30).count();
```

Count occurrences from `n` days ago:

```typescript
const nDaysAgo = data.select(8).count();
```

Sum on a field:

```typescript
const sum = data.select(0, 30).sum("property_to_sum");
```