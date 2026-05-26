import React, { useState } from 'react';
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
} from 'react-native';

// ── Types ──
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  aesthetic_description: string;
}

interface SearchResponse {
  message: string;
  products: Product[] | null;
  fallback: boolean;
}

// ── Config ──
// Change this to your machine's local IP if testing on a physical device
const API_URL = 'http://192.168.106.212:8000';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// ── Suggestion Chips ──
const SUGGESTIONS = [
  'Mid-century velvet lounge',
  'Industrial dark loft',
  'Breezy coastal boho',
  'Cyberpunk gamer room',
  'Retro 1960s warm wood',
];

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [fallback, setFallback] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setMessage('');
    setProducts([]);
    setFallback(false);

    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data: SearchResponse = await res.json();
      setMessage(data.message);
      setProducts(data.products || []);
      setFallback(data.fallback);
    } catch (err) {
      setMessage('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    Alert.alert('Added to Cart', `${product.name} — $${product.price.toFixed(2)}`);
  };

  // ── Product Card ──
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => handleAddToCart(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.logo}>Wayfair</Text>
          <Text style={styles.subtitle}>Aesthetic Matchmaker</Text>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Describe your vibe..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch()}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>✨</Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7F187F" />
            <Text style={styles.loadingText}>Translating your aesthetic...</Text>
          </View>
        ) : !hasSearched ? (
          /* ── Landing / Suggestions ── */
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 Try a vibe:</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>"{s}"</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* ── Results ── */
          <View style={{ flex: 1 }}>
            {/* Fallback / Success Message */}
            {message ? (
              <View
                style={[
                  styles.messageBanner,
                  fallback ? styles.fallbackBanner : styles.successBanner,
                ]}
              >
                <Text style={styles.messageText}>
                  {fallback ? '✨ ' : '🎉 '}
                  {message}
                </Text>
              </View>
            ) : null}

            {/* Product Grid */}
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found.</Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7F187F',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#7F187F',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F187F',
    fontWeight: '500',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#f3e8f3',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0cde0',
  },
  chipText: {
    fontSize: 15,
    color: '#7F187F',
    fontStyle: 'italic',
  },
  messageBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
    borderRadius: 8,
  },
  fallbackBanner: {
    backgroundColor: '#f8f0f8',
    borderLeftWidth: 4,
    borderLeftColor: '#7F187F',
  },
  successBanner: {
    backgroundColor: '#f0f8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#eee',
  },
  cardBody: {
    padding: 12,
  },
  cardCategory: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F187F',
    marginBottom: 10,
  },
  cartButton: {
    backgroundColor: '#7F187F',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
