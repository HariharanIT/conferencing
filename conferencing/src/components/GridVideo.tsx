import React, {useMemo, useContext, useState, useEffect} from 'react';
import {
  View,
  Platform,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import MinUidContext from '../../agora-rn-uikit/src/MinUidContext';
import MaxUidContext from '../../agora-rn-uikit/src/MaxUidContext';
import {MaxVideoView} from '../../agora-rn-uikit/Components';
import chatContext from '../components/ChatContext';
import RtcContext, {DispatchType} from '../../agora-rn-uikit/src/RtcContext';
import {DualStreamMode} from '../../agora-rn-uikit/src/PropsContext';
import FallbackLogo from '../subComponents/FallbackLogo';
import Layout from '../subComponents/LayoutEnum';

const layout = (len: number, isDesktop: boolean = true) => {
  const rows = Math.round(Math.sqrt(len));
  const cols = Math.ceil(len / rows);
  let [r, c] = isDesktop ? [rows, cols] : [cols, rows];
  return {
    matrix:
      len > 0
        ? [
            ...Array(r - 1)
              .fill(null)
              .map(() => Array(c).fill('X')),
            Array(len - (r - 1) * c).fill('X'),
          ]
        : [],
    dims: {r, c},
  };
};

// const isDesktop = Platform.OS === 'web';

interface GridVideoProps {
  setLayout: React.Dispatch<React.SetStateAction<Layout>>;
}

const GridVideo = (props: GridVideoProps) => {
  const max = useContext(MaxUidContext);
  const min = useContext(MinUidContext);
  const {userList, localUid} = useContext(chatContext);
  const users = [...max, ...min];
  const {dispatch} = useContext(RtcContext);
  let onLayout = (e: any) => {
    setDim([e.nativeEvent.layout.width, e.nativeEvent.layout.height]);
  };
  const [dim, setDim] = useState([
    Dimensions.get('window').width,
    Dimensions.get('window').height,
    Dimensions.get('window').width > Dimensions.get('window').height,
  ]);
  const isDesktop = dim[0] > dim[1] + 100;
  let {matrix, dims} = useMemo(() => layout(users.length, isDesktop), [
    users.length,
    isDesktop,
  ]);
  useEffect(() => {
    console.log(`[GridVideo]: ${users.length} users`);
    if (users.length > 5) {
      (dispatch as DispatchType<'UpdateDualStreamMode'>)({
        type: 'UpdateDualStreamMode',
        value: [DualStreamMode.LOW],
      });
    } else {
      (dispatch as DispatchType<'UpdateDualStreamMode'>)({
        type: 'UpdateDualStreamMode',
        value: [DualStreamMode.HIGH],
      });
    }
  }, [users.length]);
  return (
    <View style={style.full} onLayout={onLayout}>
      {matrix.map((r, ridx) => (
        <View style={style.gridRow} key={ridx}>
          {r.map((c, cidx) => (
            <TouchableOpacity
              onPress={() => {
                if (!(ridx === 0 && cidx === 0)) {
                  dispatch({
                    type: 'SwapVideo',
                    value: [users[ridx * dims.c + cidx]],
                  });
                }
                props.setLayout(Layout.Pinned);
              }}
              style={{
                flex: Platform.OS === 'web' ? 1 / dims.c : 1,
                marginHorizontal: 'auto',
              }}
              key={cidx}>
              <View style={style.gridVideoContainerInner}>
                <MaxVideoView
                  fallback={FallbackLogo}
                  user={users[ridx * dims.c + cidx]}
                  key={users[ridx * dims.c + cidx].uid}
                />
                <View
                  style={{
                    marginTop: -25,
                    backgroundColor: '#ffffffbb',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 8,
                    height: 25,
                    // alignItems: 'flex-start',
                  }}>
                  <Text
                    textBreakStrategy={'simple'}
                    style={{
                      color: '#333',
                      lineHeight: 25,
                      fontWeight: '700',
                      width: '100%',
                      alignSelf: 'stretch',
                      textAlign: 'center',
                    }}>
                    {users[ridx * dims.c + cidx].uid === 'local'
                      ? userList[localUid]
                        ? userList[localUid].name + ' '
                        : 'You '
                      : userList[users[ridx * dims.c + cidx].uid]
                      ? userList[users[ridx * dims.c + cidx].uid].name + ' '
                      : users[ridx * dims.c + cidx].uid === 1
                      ? userList[localUid].name + "'s screenshare "
                      : 'User '}
                  </Text>
                  {/* {console.log(
                    '!nax',
                    userList,
                    userList[users[ridx * dims.c + cidx].uid],
                    userList[localUid],
                    users[ridx * dims.c + cidx].uid,
                  )} */}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const style = StyleSheet.create({
  full: {
    flex: 1,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  gridVideoContainerInner: {
    // borderColor: '#fff',
    // borderWidth:2,
    flex: 1,
    margin: 1,
  },
});
export default GridVideo;
