<script setup lang="ts">
import type { Ref, UnwrapNestedRefs } from 'vue'
import { onMounted, watch } from 'vue'
import type { UnReadDm, UnReadMessage, UserInfo } from './types'
import { updateInterval } from './notify'
import { getUserID } from '~/utils/main'
import { settings } from '~/logic'

interface Props {
  showSearchBar: boolean
  showTopbarMask: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSearchBar: true,
})

const mid = getUserID() || ''
const userInfo = reactive<UserInfo | {}>({}) as UnwrapNestedRefs<UserInfo>

const showChannelsPop = ref<boolean>(false)
const showUserPanelPop = ref<boolean>(false)
// const showTopbarMask = ref<boolean>(false)
const showNotificationsPop = ref<boolean>(false)
const showMomentsPop = ref<boolean>(false)
const showFavoritesPop = ref<boolean>(false)
const showUploadPop = ref<boolean>(false)
const showHistoryPop = ref<boolean>(false)
const showMorePop = ref<boolean>(false)

const momentsPopKey = ref<string>(`momentsPop[${Number(new Date())}]`)

const isLogin = ref<boolean>(false)
const unReadMessage = reactive<UnReadMessage | {}>(
  {},
) as UnwrapNestedRefs<UnReadMessage>
const unReadDm = reactive<UnReadDm | {}>({} as UnwrapNestedRefs<UnReadDm>)
const unReadMessageCount = ref<number>(0)
const newMomentsCount = ref<number>(0)

const logo = ref<HTMLElement>() as Ref<HTMLElement>
const avatarImg = ref<HTMLImageElement>() as Ref<HTMLImageElement>
const avatarShadow = ref<HTMLImageElement>() as Ref<HTMLImageElement>

const isHomePage = computed(() => {
  if (
    /https?:\/\/bilibili.com\/?$/.test(location.href)
  || /https?:\/\/www.bilibili.com\/?$/.test(location.href)
  || /https?:\/\/www.bilibili.com\/index.html$/.test(location.href)
  || /https?:\/\/bilibili.com\/\?spm_id_from=.*/.test(location.href)
  || /https?:\/\/www.bilibili.com\/\?spm_id_from=(.)*/.test(location.href)
  )
    return true
  return false
})

watch(
  showNotificationsPop,
  (newVal, oldVal) => {
    if (newVal === oldVal)
      return

    if (!newVal)
      getUnreadMessageCount()
  },
)

watch(
  showMomentsPop,
  async (newVal, oldVal) => {
    if (newVal === oldVal)
      return

    if (!newVal)
      await getNewMomentsCount()
  },
)

onMounted(() => {
  initData()
})

async function initData() {
  await getUserInfo()
  getUnreadMessageCount()
  getNewMomentsCount()

  // automatically update notifications and moments count
  setInterval(() => {
    getUnreadMessageCount()
    getNewMomentsCount()
  }, updateInterval)
}

function showLogoMenuDropdown() {
  logo.value.classList.add('hover')
  showChannelsPop.value = true
}

function closeLogoMenuDropdown() {
  logo.value.classList.remove('hover')
  showChannelsPop.value = false
}

function openUserPanel() {
  showUserPanelPop.value = true
  avatarImg.value.classList.add('hover')
  avatarShadow.value.classList.add('hover')
}

function closeUserPanel() {
  showUserPanelPop.value = false
  avatarImg.value.classList.remove('hover')
  avatarShadow.value.classList.remove('hover')
}

async function getUserInfo() {
  try {
    const res = await browser.runtime
      .sendMessage({
        contentScriptQuery: 'getUserInfo',
      })

    if (res.code === 0) {
      isLogin.value = true
      Object.assign(userInfo, res.data)
    }
    // Account not logged in
    else if (res.code === -101) {
      isLogin.value = false
    }
  }
  catch (error) {
    isLogin.value = false
    console.error(error)
  }
}

async function getUnreadMessageCount() {
  if (!isLogin.value)
    return

  unReadMessageCount.value = 0

  try {
    let res
    res = await browser.runtime.sendMessage({
      contentScriptQuery: 'getUnreadMsg',
    })
    if (res.code === 0) {
      Object.assign(unReadMessage, res.data)
      Object.entries(unReadMessage).forEach(([key, value]) => {
        if (key !== 'up')
          unReadMessageCount.value += typeof value === 'number' ? value : 0
      })
    }

    res = await browser.runtime.sendMessage({
      contentScriptQuery: 'getUnreadDm',
    })
    if (res.code === 0) {
      Object.assign(unReadDm, res.data)
      Object.entries(unReadDm).forEach(([, value]) => {
        unReadMessageCount.value += typeof value === 'number' ? value : 0
      })
    }
  }
  catch (error) {
    unReadMessageCount.value = 0
    console.error(error)
  }
}

async function getNewMomentsCount() {
  if (!isLogin)
    return

  newMomentsCount.value = 0

  try {
    const res = await browser.runtime.sendMessage({
      contentScriptQuery: 'getNewMomentsCount',
    })
    newMomentsCount.value = res.data.update_info.item.count
    // If moments count > 0 then refresh the key to get the new moments
    if (newMomentsCount.value > 0)
      momentsPopKey.value = `momentsPop[${Number(new Date())}]`
  }
  catch {
    newMomentsCount.value = 0
  }
}
</script>

<template>
  <header
    flex="~"
    justify="between"
    items-center
    p="lg:x-20 md:x-16 x-14"
    w="screen"
    h="80px"
  >
    <Transition name="fade">
      <div
        v-show="showTopbarMask"
        class="fixed top-0 left-0"
        w="full"
        h="100px"
        opacity="100"
        pointer-events-none
        z--1
        :style="{ background: settings.wallpaper && isHomePage ? 'linear-gradient(rgba(0,0,0,0.5), transparent)' : `linear-gradient(var(--bew-homepage-bg), transparent)` }"
      />
    </Transition>

    <div
      class="left-side" z-1
      @mouseenter.self="showLogoMenuDropdown()"
      @mouseleave.self="closeLogoMenuDropdown()"
    >
      <a
        ref="logo" class="logo" href="//www.bilibili.com"
      >
        <svg
          t="1645466458357"
          class="icon"
          viewBox="0 0 2299 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="2663"
          width="60"
          height="60"
        >
          <path
            d="M1775.840814 322.588002c6.0164 1.002733 53.144869-9.525967 55.150336-6.016401 3.0082 4.5123 24.065601 155.92504 18.550567 156.927774s-44.621635 10.027334-44.621635 10.027334c-3.0082-20.556034-28.577901-147.903173-29.079268-160.938707m75.205003-14.539634l20.556034 162.944174c10.5287-0.501367 53.144869-3.509567 57.155803-4.010934-6.0164-61.668103-16.545101-158.933241-16.545101-158.93324-20.054668-4.010934-41.112069-4.010934-61.166736 0m-40.610702 226.116376s92.752838-23.564234 126.344406-12.0328c17.046467 61.668103 48.131202 407.611118 51.139402 421.649386-21.057401 2.506833-90.246004 8.523234-95.761037 10.027333-4.5123-26.071068-81.72277-403.098818-81.722771-419.643919m343.436183-207.565809c5.515034 1.5041 54.648969-5.013667 55.150335-1.5041 1.002733 12.032801 6.0164 157.42914 0.501367 157.930507s-44.621635 4.010934-44.621635 4.010934c-1.002733-20.054668-12.032801-146.90044-11.030067-160.437341m75.70637-4.010933l4.010933 160.938707c10.5287 0 52.643502 2.506833 57.155803 2.005467-1.002733-61.668103 0-158.933241 0-158.933241-20.054668-3.509567-40.610702-5.013667-61.166736-4.010933m-64.676303 216.089043s94.758304-12.534167 126.845772 2.506833c7.019134 72.196803 6.0164 408.613852 7.019134 422.652119-21.558768 0-90.246004 1.002733-95.761038 2.005467-1.002733-26.071068-39.607968-410.619319-38.103868-427.164419m-220.099977-413.627519c54.648969 278.759879 96.262404 755.058234 97.766504 785.641602 0 0 43.117535 1.002733 91.750105 4.010934C2105.740095 614.383415 2070.644427 134.575493 2071.145794 119.033126c-12.032801-13.536901-126.344406 6.0164-126.344406 6.0164m-120.328005 659.297196c-10.5287-78.213204-290.291313-166.955108-447.720454-138.377206 0 0-19.553301-172.470141-27.073801-339.425248-6.517767-143.390873-1.002733-282.770813 0.501366-305.833681-10.5287-7.5205-123.837572 46.627102-185.004308 69.188603 0 0 73.199537 309.844614 126.344406 952.59671 0 0 84.730971 9.0246 230.12731-19.051934s317.365114-115.815705 302.825481-219.097244m-341.932083 140.88404l-24.566967-176.982441c6.0164-3.0082 156.927774 53.144869 172.971507 63.172203-2.506833 11.030067-148.40454 113.810238-148.40454 113.810238M610.664628 322.588002c6.0164 1.002733 53.144869-9.525967 55.150335-6.016401 3.0082 4.5123 24.065601 155.92504 18.550568 156.927774s-44.621635 10.027334-44.621635 10.027334c-3.0082-20.556034-28.577901-147.903173-29.079268-160.938707m75.205003-14.539634l20.556034 162.944174c10.5287-0.501367 53.144869-3.509567 57.155803-4.010934-6.517767-61.668103-16.545101-158.933241-16.545101-158.93324-20.054668-4.010934-41.112069-4.010934-61.166736 0m-40.610702 226.116376s92.752838-23.564234 126.344406-12.0328c17.046467 61.668103 48.131202 407.611118 51.139402 421.649386-21.057401 2.506833-90.246004 8.523234-95.761037 10.027333-4.5123-26.071068-81.72277-403.098818-81.722771-419.643919m343.436182-207.565809c5.515034 1.5041 54.648969-5.013667 55.150336-1.5041 1.002733 12.032801 6.0164 157.42914 0.501367 157.930507s-44.621635 4.010934-44.621635 4.010934c-1.002733-20.054668-11.531434-146.90044-11.030068-160.437341m75.706371-4.010933l4.010933 160.938707c10.5287 0 52.643502 2.506833 57.155803 2.005467-1.002733-61.668103 0-158.933241 0-158.933241-20.054668-3.509567-40.610702-4.5123-61.166736-4.010933m-64.676303 216.089043s94.758304-12.534167 126.845772 2.506833c7.019134 72.196803 6.0164 408.613852 7.019134 422.652119-21.558768 0-90.246004 1.002733-95.761038 2.005467-0.501367-26.071068-39.607968-410.619319-38.103868-427.164419m-220.099977-413.627519c54.648969 278.759879 96.262404 755.058234 97.766504 785.641602 0 0 43.117535 1.002733 91.750105 4.010934-28.577901-300.318647-63.67357-780.126569-63.172203-796.170303-12.032801-13.035534-126.344406 6.517767-126.344406 6.517767m-120.328005 659.297196c-10.5287-78.213204-290.291313-166.955108-447.720454-138.377206 0 0-19.553301-172.470141-27.073801-339.425248-6.517767-143.390873-1.002733-282.770813 0.501366-305.833681C174.475608-6.308547 61.166736 47.337689 0 69.89919c0 0 73.199537 309.844614 126.344406 952.59671 0 0 84.730971 9.0246 230.12731-19.051934s317.365114-115.815705 302.825481-219.097244m-341.932083 140.88404l-24.566967-176.982441c6.0164-3.0082 156.927774 53.144869 172.971507 63.172203-2.506833 11.030067-148.40454 113.810238-148.40454 113.810238"
            p-id="2664"
          />
        </svg>

        <!-- <tabler:chevron-down
          w="!4"
          h="!4"
          m="l-4"
          icon="stroke-4"
          :style="{ color: settings.wallpaper && showTopbarMask ? 'white' : 'var(--bew-text-1)' }"
        /> -->
      </a>
      <Transition name="slide-in">
        <TopbarChannelsPop
          v-if="showChannelsPop"
          class="bew-popover"
          pos="!left-0 !top-70px"
          transform="!translate-x-0"
        />
      </Transition>
    </div>

    <!-- search bar -->
    <div flex="~" w="full" justify="md:center <md:end" items-center>
      <Transition name="slide-out">
        <SearchBar v-if="props.showSearchBar" ref="searchBar" />
      </Transition>
    </div>

    <!-- right content -->
    <div class="right-side">
      <div v-if="!isLogin" class="right-side-item">
        <a href="https://passport.bilibili.com/login" class="login">
          <ic:outline-account-circle class="text-xl mr-2" />{{
            $t('topbar.sign_in')
          }}
        </a>
      </div>
      <template v-if="isLogin">
        <!-- Avatar -->
        <div
          class="avatar right-side-item"
          @mouseenter="openUserPanel"
          @mouseleave="closeUserPanel"
        >
          <a
            ref="avatarImg"
            :href="`https://space.bilibili.com/${mid}`"
            target="_blank"
            class="avatar-img"
            rounded-full
            z-1
            w-40px
            h-40px
            bg="$bew-fill-3 cover center"
            :style="{
              backgroundImage: `url(${`${userInfo.face}`.replace(
                'http:',
                '',
              )})`,
            }"
          />
          <div
            ref="avatarShadow"
            class="avatar-shadow"
            pos="absolute top-0"
            bg="cover center"
            blur-sm
            opacity="80"
            rounded-full
            z-0
            w-40px
            h-40px
            :style="{
              backgroundImage: `url(${`${userInfo.face}`.replace(
                'http:',
                '',
              )})`,
            }"
          />
          <Transition name="slide-in">
            <TopbarUserPanelPop
              v-if="showUserPanelPop"
              :user-info="userInfo"
              after:h="!0"
              class="bew-popover"
            />
          </Transition>
        </div>

        <div display="lg:flex none">
          <!-- Notifications -->
          <div
            class="right-side-item"
            :class="{ active: showNotificationsPop }"
            @mouseenter="showNotificationsPop = true"
            @mouseleave="showNotificationsPop = false"
          >
            <div v-if="unReadMessageCount !== 0" class="unread-message">
              {{ unReadMessageCount > 999 ? '999+' : unReadMessageCount }}
            </div>
            <a
              href="https://message.bilibili.com"
              target="_blank"
              :title="$t('topbar.notifications')"
            >
              <tabler:bell />
            </a>

            <Transition name="slide-in">
              <TopbarNotificationsPop
                v-if="showNotificationsPop"
                class="bew-popover"
              />
            </Transition>
          </div>

          <!-- Moments -->
          <div
            class="right-side-item"
            :class="{ active: showMomentsPop }"
            @mouseenter="showMomentsPop = true"
            @mouseleave="showMomentsPop = false"
          >
            <div v-if="newMomentsCount !== 0" class="unread-message">
              {{ newMomentsCount > 999 ? '999+' : newMomentsCount }}
            </div>
            <a
              href="https://t.bilibili.com"
              target="_blank"
              :title="$t('topbar.moments')"
            >
              <tabler:windmill />
            </a>

            <Transition name="slide-in">
              <KeepAlive>
                <TopbarMomentsPop v-if="showMomentsPop" :key="momentsPopKey" class="bew-popover" />
              </KeepAlive>
            </Transition>
          </div>

          <!-- Favorites -->
          <div
            class="right-side-item"
            :class="{ active: showFavoritesPop }"
            @mouseenter="showFavoritesPop = true"
            @mouseleave="showFavoritesPop = false"
          >
            <a
              :href="`https://space.bilibili.com/${mid}/favlist`"
              target="_blank"
              :title="$t('topbar.favorites')"
            >
              <tabler:star />
            </a>

            <Transition name="slide-in">
              <KeepAlive>
                <TopbarFavoritesPop
                  v-if="showFavoritesPop"
                  class="bew-popover"
                />
              </KeepAlive>
            </Transition>
          </div>

          <!-- History -->
          <div
            class="right-side-item"
            :class="{ active: showHistoryPop }"
            @mouseenter="showHistoryPop = true"
            @mouseleave="showHistoryPop = false"
          >
            <a
              href="https://www.bilibili.com/account/history"
              target="_blank"
              :title="$t('topbar.history')"
            >
              <tabler:clock />
            </a>

            <Transition name="slide-in">
              <TopbarHistoryPop v-if="showHistoryPop" class="bew-popover" />
            </Transition>
          </div>

          <!-- Creative center -->
          <div class="right-side-item">
            <a
              href="https://member.bilibili.com/platform/home"
              target="_blank"
              :title="$t('topbar.creative_center')"
            >
              <tabler:bulb />
            </a>
          </div>
        </div>

        <!-- More -->
        <div
          class="right-side-item"
          :class="{ active: showMorePop }"
          display="lg:none block"
          @mouseenter="showMorePop = true"
          @mouseleave="showMorePop = false"
        >
          <a title="More">
            <tabler:menu-2 />
          </a>

          <Transition name="slide-in">
            <TopbarMorePop v-show="showMorePop" class="bew-popover" />
          </Transition>
        </div>

        <!-- Upload -->
        <div
          class="upload right-side-item"
          @mouseenter="showUploadPop = true"
          @mouseleave="showUploadPop = false"
        >
          <a
            href="https://member.bilibili.com/platform/upload/video/frame"
            target="_blank"
            bg="$bew-theme-color"
            rounded-40px
            un-text="!white !base"
            m="x-1"
            flex="~"
            justify="center"
            w="xl:100px 42px"
            h="xl:auto 42px"
            p="xl:auto x-4"
            shadow
            filter="hover:brightness-110"
            style="--un-shadow: 0 0 10px var(--bew-theme-color-60)"
          >
            <tabler:upload flex-shrink-0 />
            <span m="l-2" display="xl:block none">{{
              $t('topbar.upload')
            }}</span>
          </a>

          <Transition name="slide-in">
            <TopbarUploadPop
              v-if="showUploadPop"
              class="bew-popover"
              pos="!left-auto !right-0"
              transform="!translate-x-0"
            />
          </Transition>
        </div>
      </template>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  --at-apply: transition-all duration-300 pointer-events-none transform-gpu;
}

.slide-in-leave-to,
.slide-in-enter-from {
  --at-apply: transform important:translate-y-4 opacity-0;
}

.slide-out-enter-active,
.slide-out-leave-active {
  --at-apply: transition-all duration-300 pointer-events-none transform-gpu;
}

.slide-out-leave-to,
.slide-out-enter-from {
  --at-apply: transform important:-translate-y-4 opacity-0;
}

.fade-enter-active,
.fade-leave-active {
  --at-apply: transition-all duration-600;
}

.fade-leave-to,
.fade-enter-from {
  --at-apply: opacity-0;
}

.bew-popover {
  --at-apply: absolute top-60px left-1/2
    transform -translate-x-1/2
    overflow-visible
    after:content-empty
    after:opacity-100 after:w-full after:h-100px
    after:absolute after:-top-30px after:left-1/2 after:-z-1
    after:transform after:-translate-x-1/2;
}

.left-side {
  --at-apply: relative;
  .logo {
    --at-apply: flex items-center;

    &.hover {
      svg:nth-child(2) {
        --at-apply: transform rotate-180;
      }
    }

    svg {
      --at-apply: w-60px h-auto filter drop-shadow-lg
      fill-$bew-logo-color;

      &:nth-child(2) {
        --at-apply: duration-300;
      }
    }
  }
}

.right-side {
  --at-apply: flex h-60px items-center rounded-full p-2
    bg-$bew-content-1 text-$bew-text-1;
  backdrop-filter: var(--bew-filter-glass);
  box-shadow: var(--bew-shadow-2);

  .unread-message {
    --at-apply: absolute -top-1 right-0
      important:px-1 important:py-2 rounded-full
      text-xs leading-0 z-1 min-w-16px h-16px
      flex justify-center items-center
      bg-$bew-theme-color  text-white;
    box-shadow: 0 2px 4px rgba(var(--tw-shadow-color), 0.4);
  }

  .right-side-item {
    --at-apply: relative text-$bew-text-1 mx-2;

    &:not(.avatar) {
      a {
        --at-apply:text-xl flex items-center p-2 rounded-40px
          duration-300;
      }
    }

    &:not(.avatar):not(.upload) a:not(.login) {
      --un-drop-shadow: drop-shadow(0 0 6px white);
      --at-apply:dark:filter dark-hover:bg-white dark-hover:text-black
        hover:bg-$bew-fill-2;
    }

    &.active a {
      --un-drop-shadow: drop-shadow(0 0 6px white);
      --at-apply:dark:filter dark:bg-white dark:text-black
        bg-$bew-fill-2;
    }
  }

  .right-side-item .login {
    --un-drop-shadow: drop-shadow(0 0 6px var(--bew-theme-color));
    --at-apply: rounded-full
      important:text-$bew-theme-color important:px-4
      hover:important-bg-$bew-theme-color hover:important-text-white
      flex items-center justify-center important:text-base w-120px
      border-solid border-$bew-theme-color border-2
      important:dark:filter;
  }

  .avatar {
    --at-apply: flex items-center ml-1 pr-2 relative z-1;

    .avatar-img,
    .avatar-shadow {
      --at-apply: duration-300;

      &.hover {
        --at-apply: transform scale-230 important:translate-y-30px;
      }
    }

    .avatar-shadow {
      --at-apply: pointer-events-none;
    }
  }
}
</style>
