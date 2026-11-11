import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';

import I18n from '../../utils/i18n';
import theme from '../../styles/theme.style';

const VimeoVideo = ({ vimeoId, sounds, shouldPlay }) => {
  const isFocused = useRef(false);
  const autoplay = useRef(shouldPlay);
  autoplay.current = shouldPlay;
  const player = useVideoPlayer(null, (player) => {
    player.loop = true;
    player.audioMixingMode = Platform.OS === 'ios' ? 'mixWithOthers' : 'duckOthers';
  });
  const [isBuffering, setBuffer] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    player.muted = !sounds;
  }, [player, sounds]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      setBuffer(status === 'loading');
      setError(status === 'error' ? error : null);
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    const vimeoUrlSource = `https://player.vimeo.com/video/${vimeoId}/config`;
    let aborted = false;
    setBuffer(true);
    setError(null);

    fetch(vimeoUrlSource)
      .then((res) => res.json())
      .then((res) => {
        const videoArray = res.request.files.progressive;
        const videoVimeoQuality = videoArray.find((videoObject) => videoObject.quality === '540p');
        if (!videoVimeoQuality?.url) throw new Error('No 540p Vimeo source available');
        return videoVimeoQuality.url;
      })
      .then(async (url) => {
        if (aborted) return;
        await player.replaceAsync({ uri: url });
        if (!aborted && isFocused.current && autoplay.current) player.play();
      })
      .catch((e) => {
        if (aborted) return;
        setError(e);
        setBuffer(false);
      });

    return () => (aborted = true);
  }, [vimeoId, player]);

  // Stop playing the video on screen change
  useFocusEffect(
    React.useCallback(() => {
      isFocused.current = true;
      return () => {
        isFocused.current = false;
        player.pause();
      };
    }, [player]),
  );

  const renderBufferIcon = () => {
    return (
      <View style={styles.spinnerStyle}>
        <ActivityIndicator animating color={theme.COLOR_SECONDARY} size="large" />
        <Text>{I18n.t('vimeoVideo.loading')}</Text>
      </View>
    );
  };

  const renderError = () => {
    return (
      <View style={styles.spinnerStyle}>
        <Text>{I18n.t('vimeoVideo.error')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.videoContainer}>
      {error && renderError()}
      {isBuffering && renderBufferIcon()}
      <VideoView
        player={player}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: true }}
        style={{ width: '100%', height: 250 }}
        onFullscreenEnter={() => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT)}
        onFullscreenExit={() => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerStyle: {
    position: 'absolute',
  },
});

export default VimeoVideo;
