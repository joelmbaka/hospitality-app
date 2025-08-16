import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';


// Loading overlay styles
const styles = StyleSheet.create({
  loadingOverlay: {
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
  },
});


export default function CheckoutScreen() {
  
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!url) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleRequest = (request: any) => {
    const reqUrl: string = request.url;
    if (reqUrl.includes('payment-success')) {
      router.replace('/guest/orders' as any);
      return false;
    }
    if (reqUrl.includes('payment-cancel')) {
      router.replace('/guest' as any);
      return false;
    }
    return true;
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: url as string }}
        style={{ flex: 1, marginTop: insets.top }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={handleRequest}
      />

    </View>
  );
}
