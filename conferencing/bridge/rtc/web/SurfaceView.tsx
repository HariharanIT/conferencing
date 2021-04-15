import React, {useEffect} from 'react';
import {StyleProp, StyleSheet, ViewProps, ViewStyle} from 'react-native';
import {VideoMirrorMode, VideoRenderMode} from 'react-native-agora/lib/Types';

export interface RtcSurfaceViewProps extends ViewProps {
  zOrderMediaOverlay?: boolean;
  zOrderOnTop?: boolean;
  renderMode?: VideoRenderMode;
  channelId?: string;
  mirrorMode?: VideoMirrorMode;
}
export interface RtcUidProps {
  uid: number;
}
export interface StyleProps {
  style?: StyleProp<ViewStyle>;
}

interface SurfaceViewInterface
  extends RtcSurfaceViewProps,
    RtcUidProps,
    StyleProps {}

const SurfaceView = (props: SurfaceViewInterface) => {
  //   console.log('Surface View props', props);
  const stream: AgoraRTC.Stream = window.engine.streams.get(props.uid);
  useEffect(
    function () {
      if (stream) {
        if (props.renderMode === 2) {
          stream.play(String(props.uid), {fit: 'contain'});
        } else {
          stream.play(String(props.uid));
        }
      }
      return () => {
        console.log(`unmounting stream ${props.uid}`, stream);
        stream && stream.stop();
      };
    },
    [props.uid, props.renderMode, stream],
  );

  return stream ? (
    <div
      id={String(props.uid)}
      className={'video-container'}
      style={{...style.full, ...(props.style as Object)}}
    />
  ) : (
    <></>
  );
};

const style = StyleSheet.create({
  full: {
    flex: 1,
  },
});

export default SurfaceView;
