import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, DatePicker } from 'antd';
import cls from 'classnames';
import { RangePickerValue } from 'antd/lib/date-picker/interface';
import moment from 'moment';
import { message } from 'antd/es';
import styles from './Statistics.less';
import ChartWrapper from '@/components/ChartWrapper/ChartWrapper';
import {
  FromView,
  IEchartsOption,
  processFromViewOptions,
  processRepoViewOptions,
  processVolumeView,
  RepoView,
  RootObject,
  VolumeView,
} from '@/pages/dashboard/echartsOptions';
import { fetchHomeView, IHomeViewParams } from '@/services/Statistics';
import request from '@/http/axiosRequest';
import { DATE_TEXT_MAP, DayKey } from '@/pages/dashboard/timeConfig';

const { RangePicker } = DatePicker;

interface IOptionsWithKey {
  key: number;
  options: IEchartsOption;
}

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [fromView, setFromView] = useState<FromView | {}>({});
  const [repoView, setRepoView] = useState<RepoView | {}>({});
  const [volumeView, setVolumeView] = useState<VolumeView | {}>({});
  const [date, setDate] = useState<RangePickerValue>([moment().subtract(1, 'day'), moment()]);
  const [activeDateText, setActiveDateText] = useState<DayKey | ''>('yesterday');
  const optionsList: IOptionsWithKey[] = useMemo(
    () => [
      { key: 1, options: processFromViewOptions(fromView) },
      { key: 2, options: processRepoViewOptions(repoView) },
      { key: 3, options: processVolumeView(volumeView) },
    ],
    [fromView, repoView, volumeView],
  );
  const fetchHomeData = (params: IHomeViewParams) => {
    setLoading(true);
    request<IHomeViewParams, RootObject>({ ...fetchHomeView, params }).then(
      response => {
        setLoading(false);
        setFromView(response.payload.from_view);
        setRepoView(response.payload.repo_view);
        setVolumeView(response.payload.volume_view);
      },
      () => {
        setLoading(false);
      },
    );
  };
  const handleRangeDate = ([startTime, endTime]: RangePickerValue) => {
    if (typeof startTime === 'undefined' || typeof endTime === 'undefined') {
      return [];
    }
    const dateSetFormat = { hour: 0, minute: 0, second: 0 };
    const startStamps = startTime.set(dateSetFormat).unix();
    const endStamps = endTime.set(dateSetFormat).unix();
    return [startStamps, endStamps];
  };
  useEffect(() => {
    const [startStamps, endStamps] = handleRangeDate(date);
    fetchHomeData({ start_time: startStamps, end_time: endStamps });
  }, []);
  const onClickDateText = (key: DayKey) => {
    setActiveDateText(key);
    const currentDate: [moment.Moment, moment.Moment] = [DATE_TEXT_MAP[key].date, moment()];
    const [startStamps, endStamps] = handleRangeDate(currentDate);
    setDate(currentDate);
    fetchHomeData({
      start_time: startStamps,
      end_time: endStamps,
    });
  };

  const onChangeDate = ([startTime, endTime]: RangePickerValue) => {
    const [startStamps, endStamps] = handleRangeDate([startTime, endTime] as RangePickerValue);
    if (startStamps === endStamps) {
      message.warning('请选择一个范围');
      return;
    }
    setActiveDateText('');
    setDate([startTime, endTime] as RangePickerValue);
    fetchHomeData({ start_time: startStamps, end_time: endStamps });
  };
  const mainSearch = (
    <Fragment>
      <div className={styles.searchTextWrapper}>
        {/* FIXME:如何优化这里key的类型，而不用使用类型断言 */}
        {Object.keys(DATE_TEXT_MAP).map(key => (
          <a
            className={cls(styles.searchText, { [styles.active]: activeDateText === key })}
            onClick={() => onClickDateText(key as DayKey)}
            key={key}
          >
            {DATE_TEXT_MAP[key as DayKey].text}
          </a>
        ))}
      </div>
      <RangePicker value={date} className={styles.rangeDatePicker} onChange={onChangeDate} />
    </Fragment>
  );
  return (
    <PageHeaderWrapper className={styles.statistics} content={mainSearch}>
      {optionsList.map(item => (
        <Card className={styles.card} bordered={false} key={item.key}>
          <ChartWrapper loading={loading} height="400px" options={item.options} />
        </Card>
      ))}
    </PageHeaderWrapper>
  );
};

export default Statistics;
