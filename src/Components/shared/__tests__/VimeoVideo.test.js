import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContext } from '@react-navigation/native';
import { VideoView } from 'expo-video';
import NativeVideoModule from 'expo-video/build/ExpoVideo';
import * as ScreenOrientation from 'expo-screen-orientation';

import VimeoVideo from '../VimeoVideo';

describe('<VimeoVideo />', () => {
  // fake NavigationContext value data
  const navContext = {
    isFocused: () => true,
    // addListener returns an unscubscribe function.
    addListener: jest.fn(() => jest.fn()),
  };

  const response = {
    json: async () => ({
      request: { files: { progressive: [{ quality: '540p', url: 'https://example.com/video.mp4' }] } },
    }),
  };
  let replaceAsync;

  beforeEach(() => {
    jest.clearAllMocks();
    replaceAsync = jest.spyOn(NativeVideoModule.VideoPlayer.prototype, 'replaceAsync');
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (url.includes('does_not_exist')) throw new Error('Video not found');
      return response;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  const renderVideo = (props = {}) =>
    render(
      <NavigationContext.Provider value={navContext}>
        <VimeoVideo vimeoId="407999139" {...props} />
      </NavigationContext.Provider>,
    );

  it('loads the video', async () => {
    const vimeo_video_id = '407999139';

    const { getByText, toJSON } = render(
      <NavigationContext.Provider value={navContext}>
        <VimeoVideo vimeoId={vimeo_video_id} />
      </NavigationContext.Provider>,
    );

    expect(getByText('Loading…')).toBeDefined(); // Displayed by default

    await waitFor(() => getByText('Loading…'));

    expect(toJSON()).toMatchSnapshot();
  });

  it('displays a message on error', async () => {
    const not_found_video_id = '123456789_id_that_does_not_exist';

    const { getByText, toJSON } = await waitFor(() =>
      render(
        <NavigationContext.Provider value={navContext}>
          <VimeoVideo vimeoId={not_found_video_id} />
        </NavigationContext.Provider>,
      ),
    );

    await waitFor(() => getByText('Oopsie! There was an error loading the video…'));

    expect(toJSON()).toMatchSnapshot();
  });

  it('loads the 540p source and autoplays with sound when requested', async () => {
    const screen = renderVideo({ sounds: true, shouldPlay: true });
    const player = screen.UNSAFE_getByType(VideoView).props.player;

    await waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith('https://player.vimeo.com/video/407999139/config');
    expect(replaceAsync).toHaveBeenCalledWith({ uri: 'https://example.com/video.mp4' });
    expect(player.loop).toBe(true);
    expect(player.muted).toBe(false);
    act(() => player.emit('statusChange', { status: 'readyToPlay' }));
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('defaults to muted and paused, and displays native playback errors', async () => {
    const screen = renderVideo();
    const player = screen.UNSAFE_getByType(VideoView).props.player;
    await waitFor(() => expect(replaceAsync).toHaveBeenCalledTimes(1));
    expect(player.muted).toBe(true);
    expect(player.play).not.toHaveBeenCalled();

    act(() => player.emit('statusChange', { status: 'error', error: { message: 'Decoder failed' } }));
    expect(screen.getByText('Oopsie! There was an error loading the video…')).toBeDefined();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('pauses on blur and does not autoplay a source that finishes loading afterward', async () => {
    let resolveFetch;
    fetch.mockReturnValueOnce(new Promise((resolve) => (resolveFetch = resolve)));
    const screen = renderVideo({ shouldPlay: true });
    const player = screen.UNSAFE_getByType(VideoView).props.player;
    const onBlur = navContext.addListener.mock.calls.find(([event]) => event === 'blur')[1];
    act(onBlur);
    expect(player.pause).toHaveBeenCalledTimes(1);

    await act(async () => resolveFetch(response));
    await waitFor(() => expect(replaceAsync).toHaveBeenCalledTimes(1));
    expect(player.play).not.toHaveBeenCalled();
  });

  it('ignores a source response after unmount', async () => {
    let resolveFetch;
    fetch.mockReturnValueOnce(new Promise((resolve) => (resolveFetch = resolve)));
    const screen = renderVideo();
    screen.unmount();
    await act(async () => resolveFetch(response));
    expect(replaceAsync).not.toHaveBeenCalled();
  });

  it('reports missing 540p sources', async () => {
    fetch.mockResolvedValueOnce({ json: async () => ({ request: { files: { progressive: [] } } }) });
    const screen = renderVideo();
    await waitFor(() => expect(screen.getByText('Oopsie! There was an error loading the video…')).toBeDefined());
    expect(replaceAsync).not.toHaveBeenCalled();
  });

  it('switches orientation when entering and leaving fullscreen', async () => {
    jest.spyOn(ScreenOrientation, 'lockAsync');
    const screen = renderVideo();
    const view = screen.UNSAFE_getByType(VideoView);
    expect(view.props.contentFit).toBe('contain');
    expect(view.props.nativeControls).toBe(true);
    expect(view.props.fullscreenOptions).toEqual({ enable: true });
    fireEvent(view, 'fullscreenEnter');
    expect(ScreenOrientation.lockAsync).toHaveBeenLastCalledWith(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    fireEvent(view, 'fullscreenExit');
    expect(ScreenOrientation.lockAsync).toHaveBeenLastCalledWith(ScreenOrientation.OrientationLock.PORTRAIT);
    await waitFor(() => expect(replaceAsync).toHaveBeenCalledTimes(1));
  });
});
