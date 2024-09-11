import { Component, createSignal } from 'solid-js';
import styles from './Settings.module.scss';

import { useIntl } from '@cookbook/solid-intl';
import { settings as t } from '../../translations';
import PageCaption from '../../components/PageCaption/PageCaption';
import { Link } from '@solidjs/router';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { useSettingsContext } from '../../contexts/SettingsContext';
import FeedSorter from '../../components/FeedSorter/FeedSorter';
import PageTitle from '../../components/PageTitle/PageTitle';
import ButtonLink from '../../components/Buttons/ButtonLink';

const ReadsFeeds: Component = () => {

  const intl = useIntl();
  const settings = useSettingsContext();

  const [isRestoringFeeds, setIsRestoringFeeds] = createSignal(false);

  const onRestoreFeeds = () => {
    // settings?.actions.restoreDefaultFeeds();
    // setIsRestoringFeeds(false);
  };

  return (
    <div>
      <PageTitle title={`${intl.formatMessage(t.readsFeeds.title)} ${intl.formatMessage(t.title)}`} />

      <PageCaption>
        <Link href='/settings' >{intl.formatMessage(t.index.title)}</Link>:&nbsp;
        <div>{intl.formatMessage(t.readsFeeds.title)}</div>
      </PageCaption>

      <div class={styles.settingsContent}>
        <div class={styles.feedCaption}>
          <div class={styles.settingsCaption}>
          {intl.formatMessage(t.readsFeeds.caption)}
          </div>

          <ButtonLink
            onClick={() => setIsRestoringFeeds(true)}
          >
            {intl.formatMessage(t.feedsRestore)}
          </ButtonLink>

          <ConfirmModal
            open={isRestoringFeeds()}
            description={intl.formatMessage(t.feedsRestoreConfirm)}
            onConfirm={onRestoreFeeds}
            onAbort={() => setIsRestoringFeeds(false)}
          ></ConfirmModal>
        </div>

        <div class={styles.feedSettings}>
          <FeedSorter
            feedType="reads"
            feeds={settings?.readsFeeds || []}
            actions={{
              remove: settings?.actions.removeFeed,
              move: settings?.actions.moveFeed,
              rename: settings?.actions.renameFeed,
              enable: settings?.actions.enableFeed,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ReadsFeeds;
