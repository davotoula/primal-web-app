import { Component, createEffect, For, Match, onMount, Switch } from 'solid-js';
import styles from './FeedMarketPlace.module.scss';

import AdvancedSearchDialog from '../AdvancedSearch/AdvancedSearchDialog';
import { subsTo } from '../../sockets';
import { APP_ID } from '../../App';
import { fetchDVMFeeds } from '../../lib/feed';
import { Kind } from '../../constants';
import { createStore } from 'solid-js/store';
import { DVMMetadata, DVMStats, NostrDVM, NostrNoteActionsContent, NoteActions, PrimalArticleFeed, PrimalDVM, PrimalUser } from '../../types/primal';
import { convertToUser } from '../../stores/profile';
import FeedMarketItem from './FeedMarketPlaceItem';
import ButtonSecondary from '../Buttons/ButtonSecondary';
import ButtonPrimary from '../Buttons/ButtonPrimary';
import { useNavigate } from '@solidjs/router';
import { explore } from '../../translations';
import { useExploreContext } from '../../contexts/ExploreContext';
import { useAccountContext } from '../../contexts/AccountContext';

export type MarketplaceStore = {
  dvms: PrimalDVM[],
  dvmStats: Record<string, DVMStats>,
  users: Record<string, PrimalUser>,
  previewDvm: PrimalDVM | undefined,
  dvmMetadata: Record<string, DVMMetadata>
  dvmActions: Record<string, NoteActions>,
}

export const emptyStore: MarketplaceStore = {
  dvms: [],
  dvmStats: {},
  users: {},
  previewDvm: undefined,
  dvmMetadata: {},
  dvmActions: {},
}

const FeedMarketPlace: Component<{
  open?: boolean,
  type?: 'notes' | 'reads',
  onAddFeed?: (feed: PrimalArticleFeed) => void,
}> = (props) => {
  const navigate = useNavigate();
  const explore = useExploreContext();

  const [store, updateStore] = createStore<MarketplaceStore>({ ...emptyStore });

  onMount(() => {
    if (store.dvms.length === 0) {
      fetchDVMs();
    }
    // else {
    //   clearDVMs();
    // }
  });

  const fetchDVMs = () => {
    const subId = `explore_feeds_${APP_ID}`;

    const unsub = subsTo(subId, {
      onEvent: (_, content) => {

        if (content.kind === Kind.DVM) {
          const dvmData = JSON.parse(content.content);

          const dvm: PrimalDVM = {
            id: content.id,
            name: dvmData.name || '',
            about: dvmData.about || '',
            amount: dvmData.amount || 'free',
            primalVerifiedRequired: dvmData.primalVerifiedRequired || false,
            pubkey: content.pubkey,
            supportedKinds: content.tags?.reduce<string[]>((acc, t: string[]) => t[0] === 'k' ? [...acc, t[1]] : acc, []) || [],
            identifier: (content.tags?.find(t => t[0] === 'd') || ['d', ''])[1],
            picture: dvmData.picture,
            image: dvmData.image,
          };

          updateStore('dvms', store.dvms.length, () => ({ ...dvm }));
          return;
        }

        if (content.kind === Kind.Metadata) {
          const user = convertToUser(content, content.pubkey);

          updateStore('users', user.pubkey, () => ({ ...user }));
          return;
        }

        if (content.kind === Kind.NoteStats) {
          const stats = JSON.parse(content.content);

          if (!stats.event_id) return;

          updateStore('dvmStats', stats.event_id, () => ({
            likes: stats.likes || 0,
            satszapped: stats.satszapped || 0,
          }));
        }

        if (content.kind === Kind.DVMMetadata) {
          const metadata = JSON.parse(content.content);

          if (!metadata.event_id) return;

          updateStore('dvmMetadata', metadata.event_id, () => ({ kind: metadata.kind, isPrimal: metadata.is_primal}))
        }

        if (content.kind === Kind.NoteActions) {
          const noteActionContent = content as NostrNoteActionsContent;
          const noteActions = JSON.parse(noteActionContent.content) as NoteActions;

          updateStore('dvmActions', noteActions.event_id, () => ({ ...noteActions }));
          return;
        }
      },
      onEose: () => {
        unsub();
      }
    });

    fetchDVMFeeds(subId, props.type);
  }

  const clearDVMs = () => {
    // delay for close animation
    setTimeout(() => {
      updateStore(() => ({
        dvms: [],
        dvmStats: {},
        users: {},
        previewDvm: undefined,
      }));

    }, 300);
  }


  return (
    <Switch>
      <Match when={!store.previewDvm}>
        <div class={styles.feedMarketplaceContent}>
          <div class={styles.boothsPage}>
            <For each={store.dvms}>
              {dvm => (
                <FeedMarketItem
                  dvm={dvm}
                  author={store.users[dvm.pubkey]}
                  stats={store.dvmStats[dvm.id]}
                  metadata={store.dvmMetadata[dvm.id]}
                  actions={store.dvmActions[dvm.id]}
                  onClick={() => {
                    explore?.actions.setPreviewDVM(
                      dvm,
                      store.dvmStats[dvm.id],
                      store.dvmMetadata[dvm.id],
                      store.users[dvm.pubkey],
                      store.dvmActions[dvm.id],
                    )
                    navigate(`/explore_new/feed/${dvm.identifier}_by_${dvm.pubkey}`)
                  }}
                />
              )}
            </For>
          </div>
        </div>
      </Match>
    </Switch>
  )
}

export default FeedMarketPlace;
