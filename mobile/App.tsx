import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ── Types ──
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image_url: string;
}

interface SearchResponse {
  message: string;
  products: Product[] | null;
  fallback: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[] | null;
  image_url?: string;
}

// ── Config ──
const API_URL = 'http://192.168.106.212:8000';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const SUGGESTIONS = [
  'Mid-century velvet lounge',
  'Industrial dark loft',
  'Breezy coastal boho',
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'cart'>('home');

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Search/Home State
  const [homeQuery, setHomeQuery] = useState('');
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeMessage, setHomeMessage] = useState('');
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [homeFallback, setHomeFallback] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    id: '1',
    role: 'assistant',
    content: "Hi! I'm your Wayfair Aesthetic Matchmaker. Describe your dream room or upload a photo, and we'll find pieces to match your vibe!"
  }]);
  const [chatLoading, setChatLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // ── Handlers ──

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    Alert.alert('Added to Cart', `${product.name} — $${product.price.toFixed(2)}`);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    Alert.alert('Checkout Complete', `Your total was $${cartTotal.toFixed(2)}. Thanks for shopping!`);
    setCart([]);
  };

  const handleHomeSearch = async (searchQuery?: string) => {
    const q = searchQuery || homeQuery;
    if (!q.trim()) return;

    setHomeLoading(true);
    setHasSearched(true);
    setHomeMessage('');
    setHomeProducts([]);
    setHomeFallback(false);

    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data: SearchResponse = await res.json();
      setHomeMessage(data.message);
      setHomeProducts(data.products || []);
      setHomeFallback(data.fallback);
    } catch (err) {
      setHomeMessage('Could not connect to the server.');
    } finally {
      setHomeLoading(false);
    }
  };

  const handleChatSend = async (customText?: string, imageUrl?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: textToSend.trim(),
      image_url: imageUrl 
    };
    const newHistory = [...chatHistory, userMsg];
    
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      // Send chat history to backend (format for OpenAI format)
      const backendHistory = chatHistory.map(msg => ({ role: msg.role, content: msg.content }));
      
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content, chat_history: backendHistory }),
      });
      const data: SearchResponse = await res.json();
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        products: data.products
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Connection error.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  // ── Vision Upload Handler ──
  const handlePickImage = async (isChat: boolean) => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64 = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const uri = result.assets[0].uri;

      if (isChat) {
        setChatLoading(true);
      } else {
        setHomeLoading(true);
        setHasSearched(true);
      }

      try {
        const res = await fetch(`${API_URL}/vision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        
        if (data.vibe) {
          if (isChat) {
             // Show user uploading image
             handleChatSend(`I uploaded a photo. It looks like: ${data.vibe}`, uri);
          } else {
             setHomeQuery(data.vibe);
             handleHomeSearch(data.vibe);
          }
        } else {
          Alert.alert('Vision Error', data.error || 'Failed to extract vibe.');
          setChatLoading(false);
          setHomeLoading(false);
        }
      } catch (err) {
        Alert.alert('Error', 'Could not reach vision API.');
        setChatLoading(false);
        setHomeLoading(false);
      }
    }
  };

  // ── Renderers ──

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => handleAddToCart(item)}>
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHome = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.cameraButton} onPress={() => handlePickImage(false)}>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Describe vibe or upload..."
          placeholderTextColor="#999"
          value={homeQuery}
          onChangeText={setHomeQuery}
          onSubmitEditing={() => handleHomeSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => handleHomeSearch()}>
          <Text style={styles.searchButtonText}>✨</Text>
        </TouchableOpacity>
      </View>

      {homeLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7F187F" />
          <Text style={styles.loadingText}>Analyzing your aesthetic...</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Try a vibe:</Text>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => { setHomeQuery(s); handleHomeSearch(s); }}>
              <Text style={styles.chipText}>"{s}"</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {homeMessage ? (
            <View style={[styles.messageBanner, homeFallback ? styles.fallbackBanner : styles.successBanner]}>
              <Text style={styles.messageText}>{homeFallback ? '✨ ' : '🎉 '} {homeMessage}</Text>
            </View>
          ) : null}
          {homeProducts.length > 0 ? (
            <FlatList
              data={homeProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
            />
          ) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No products found.</Text></View>
          )}
        </View>
      )}
    </View>
  );

  const renderChat = () => (
    <View style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
      <FlatList
        ref={flatListRef}
        data={chatHistory}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.chatBubbleContainer, item.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI]}>
            {item.image_url && (
              <Image source={{uri: item.image_url}} style={{width: 150, height: 150, borderRadius: 8, marginBottom: 8}} />
            )}
            <Text style={[styles.chatText, item.role === 'user' ? styles.chatTextUser : styles.chatTextAI]}>{item.content}</Text>
            {item.products && item.products.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {item.products.map(p => (
                  <View key={p.id} style={styles.chatProductCard}>
                    <Image source={{ uri: p.image_url }} style={styles.chatProductImage} />
                    <Text style={styles.chatProductName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.chatProductPrice}>${p.price.toFixed(2)}</Text>
                    <TouchableOpacity style={styles.chatAddToCartBtn} onPress={() => handleAddToCart(p)}>
                      <Text style={{color: '#fff', fontSize: 12, fontWeight: '600'}}>+ Cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      />
      {chatLoading && (
        <View style={{ padding: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#7F187F" />
          <Text style={{fontSize: 10, color: '#888', marginTop: 4}}>Analyzing vision / stylist...</Text>
        </View>
      )}
      <View style={styles.chatInputContainer}>
        <TouchableOpacity style={styles.chatCameraBtn} onPress={() => handlePickImage(true)}>
          <Text style={{fontSize: 20}}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask or upload..."
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={() => handleChatSend()}
        />
        <TouchableOpacity style={styles.chatSendBtn} onPress={() => handleChatSend()}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCart = () => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle}>Your Cart</Text>
        <Text style={styles.cartItemCount}>{cartItemCount} items</Text>
      </View>
      
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Image source={{ uri: item.product.image_url }} style={styles.cartItemImage} />
              <View style={styles.cartItemBody}>
                <Text style={styles.cartItemName}>{item.product.name}</Text>
                <Text style={styles.cartItemPrice}>${item.product.price.toFixed(2)}</Text>
                <Text style={styles.cartItemQty}>Qty: {item.quantity}</Text>
              </View>
              <TouchableOpacity style={styles.cartRemoveBtn} onPress={() => handleRemoveFromCart(item.product.id)}>
                <Text style={{ color: '#d32f2f' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartTotalRow}>
            <Text style={styles.cartTotalLabel}>Total:</Text>
            <Text style={styles.cartTotalAmount}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Main Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Wayfair</Text>
          <Text style={styles.subtitle}>Aesthetic Matchmaker</Text>
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'cart' && renderCart()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabActiveText]}>✨</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabActiveText]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('chat')}>
            <Text style={[styles.tabIcon, activeTab === 'chat' && styles.tabActiveText]}>💬</Text>
            <Text style={[styles.tabLabel, activeTab === 'chat' && styles.tabActiveText]}>Stylist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('cart')}>
            <View>
              <Text style={[styles.tabIcon, activeTab === 'cart' && styles.tabActiveText]}>🛒</Text>
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'cart' && styles.tabActiveText]}>Cart</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingTop: 16, paddingBottom: 8, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  logo: { fontSize: 32, fontWeight: '700', color: '#7F187F' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  
  // Home Styles
  searchContainer: { flexDirection: 'row', margin: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  cameraButton: { paddingLeft: 16, paddingRight: 8 },
  cameraIcon: { fontSize: 20 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16 },
  searchButton: { backgroundColor: '#7F187F', paddingHorizontal: 20, height: '100%', justifyContent: 'center' },
  searchButtonText: { fontSize: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#7F187F' },
  suggestionsContainer: { flex: 1, padding: 20 },
  suggestionsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  chip: { backgroundColor: '#f3e8f3', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e0cde0' },
  chipText: { fontSize: 15, color: '#7F187F', fontStyle: 'italic' },
  messageBanner: { margin: 16, padding: 14, borderRadius: 8 },
  fallbackBanner: { backgroundColor: '#f8f0f8', borderLeftWidth: 4, borderLeftColor: '#7F187F' },
  successBanner: { backgroundColor: '#f0f8f0', borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  messageText: { fontSize: 14, fontWeight: '500' },
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  gridRow: { justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 3 },
  cardImage: { width: '100%', height: 160, backgroundColor: '#eee' },
  cardBody: { padding: 12 },
  cardCategory: { fontSize: 10, color: '#999', marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardPrice: { fontSize: 18, fontWeight: '700', color: '#7F187F', marginBottom: 10 },
  cartButton: { backgroundColor: '#7F187F', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  cartButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },

  // Chat Styles
  chatBubbleContainer: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 16 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#7F187F', borderBottomRightRadius: 4 },
  chatBubbleAI: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea', borderBottomLeftRadius: 4 },
  chatText: { fontSize: 16, lineHeight: 22 },
  chatTextUser: { color: '#fff' },
  chatTextAI: { color: '#000' },
  chatInputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  chatCameraBtn: { marginRight: 10 },
  chatInput: { flex: 1, backgroundColor: '#f2f2f7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 10 },
  chatSendBtn: { backgroundColor: '#7F187F', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  chatProductCard: { width: 140, backgroundColor: '#fff', borderRadius: 8, padding: 8, marginRight: 12, borderWidth: 1, borderColor: '#eee' },
  chatProductImage: { width: '100%', height: 100, borderRadius: 4, marginBottom: 8 },
  chatProductName: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  chatProductPrice: { fontSize: 14, color: '#7F187F', marginBottom: 8 },
  chatAddToCartBtn: { backgroundColor: '#7F187F', padding: 6, borderRadius: 4, alignItems: 'center' },

  // Cart Styles
  cartHeader: { padding: 16, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTitle: { fontSize: 24, fontWeight: 'bold' },
  cartItemCount: { fontSize: 16, color: '#666' },
  cartItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cartItemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  cartItemBody: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  cartItemName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  cartItemPrice: { fontSize: 16, color: '#7F187F', fontWeight: 'bold', marginBottom: 4 },
  cartItemQty: { fontSize: 14, color: '#666' },
  cartRemoveBtn: { justifyContent: 'center', padding: 8 },
  cartFooter: { padding: 24, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cartTotalLabel: { fontSize: 20, fontWeight: '600' },
  cartTotalAmount: { fontSize: 24, fontWeight: 'bold', color: '#7F187F' },
  checkoutBtn: { backgroundColor: '#7F187F', padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 24, color: '#888' },
  tabLabel: { fontSize: 10, color: '#888', marginTop: 4 },
  tabActiveText: { color: '#7F187F', fontWeight: 'bold' },
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: 'red', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
