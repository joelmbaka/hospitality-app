import { View, Text, StyleSheet, Image, Dimensions, Platform, ScrollView, Pressable } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { useNavigationState } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import useStripeCheckout from '../../hooks/useStripeCheckout';
import useSession from '../../hooks/useSession';
import SlotPickerModal, { AvailabilitySlot } from '../SlotPickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';


const Tab = createMaterialTopTabNavigator();

function OverviewTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const { data: prop, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProperty(prop);
        if (prop?.services && prop.services.length > 0) {
          const { data: svcRows, error: svcErr } = await supabase
            .from('services')
            .select('*')
            .in('id', prop.services);
          if (!svcErr) setServices(svcRows || []);
        }
      } catch (err) {
        console.error('[OverviewTab] fetch property error', err);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>Property not found.</Text>
      </View>
    );
  }

  const { name, description, type, address, contact_info } = property;

  return (
    <ScrollView style={tabStyles.content}>
      <View style={overviewStyles.card}>
      <Text style={tabStyles.heading}>{name}</Text>
      {description && <Text style={[styles.text, { marginTop: 8 }]}>{description}</Text>}
      <Text style={[styles.text, { marginTop: 12 }]}>Type: {type}</Text>
      {address && (
        <Text style={[styles.text, { marginTop: 4 }]}>Address: {JSON.stringify(address)}</Text>
      )}
      {contact_info && (
        <Text style={[styles.text, { marginTop: 4 }]}>Contact: {JSON.stringify(contact_info)}</Text>
      )}
      {services.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 4 }]}>Services</Text>
          {services.map((s) => (
            <Text key={s.id} style={styles.text}>• {s.name}</Text>
          ))}
        </View>
      )}
      </View>
    </ScrollView>
  );
}
import { FlatList, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';

function RoomsTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const { initiateCheckout, loading: checkoutLoading } = useStripeCheckout();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        // Find accommodation service id
        const { data: svc, error: svcErr } = await supabase
          .from('services')
          .select('id')
          .eq('name', 'accommodation')
          .single();
        if (svcErr) throw svcErr;

        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('property_id', id)
          .eq('service_id', svc.id);
        if (error) throw error;
        console.log('[RoomsTab] fetched resources', data?.length);
        setResources(data || []);
      } catch (err) {
        console.error('[RoomsTab] fetch resources error', err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>Loading rooms...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={roomStyles.card}>
        <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={roomStyles.name}>{item.name}</Text>
        <Text style={roomStyles.desc}>{item.description}</Text>
        {item.price != null && (
          <Text style={roomStyles.price}>KES {Number(item.price).toFixed(0)}</Text>
        )}
        <Text style={roomStyles.specs}>{JSON.stringify(item.specifications)}</Text>
        </View>
        {/* TODO: fetch availability status */}
        <Pressable
          style={roomStyles.button}
          disabled={reserving || checkoutLoading}
          onPress={() => openPicker(item)}
        >
          <Text style={roomStyles.buttonText}>Reserve</Text>
        </Pressable>
      </View>
    );
  };

  const openPicker = (resource: any) => {
    setSelectedResource(resource);
    setPickerVisible(true);
  };

  const reserveRoomWithSlot = async (room: any, slot: AvailabilitySlot) => {
    if (reserving || checkoutLoading) return;
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    try {
      setReserving(true);
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_booking', {
        i_resource_id: room.id,
        i_start_ts: slot.start_ts,
        i_end_ts: slot.end_ts,
      });
      if (rpcErr) throw rpcErr;
      if (!orderId) {
        Alert.alert('Reservation error', 'Could not create booking.');
        return;
      }
      await initiateCheckout(orderId as unknown as string);
    } catch (err: any) {
      console.error('[RoomsTab] reserveRoomWithSlot error', err);
      Alert.alert('Reservation error', err?.message || 'Something went wrong.');
    } finally {
      setReserving(false);
    }
  };

  const handleSlotSelectRoom = (slot: AvailabilitySlot | null) => {
    setPickerVisible(false);
    if (slot && selectedResource) {
      reserveRoomWithSlot(selectedResource, slot);
    }
  };

  const reserveRoom = async (room: any) => {
    if (reserving || checkoutLoading) return;
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    try {
      setReserving(true);
      // 1. Fetch earliest open availability slot for this room
      const { data: slot, error: slotErr } = await supabase
        .from('availability')
        .select('start_ts, end_ts')
        .eq('resource_id', room.id)
        .eq('status', 'open')
        .gt('start_ts', new Date().toISOString())
        .order('start_ts')
        .limit(1)
        .single();
      if (slotErr) throw slotErr;
      if (!slot) {
        Alert.alert('No availability', 'This room has no available slots.');
        return;
      }

      // 2. Create booking + order via RPC (returns order_id)
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_booking', {
        i_resource_id: room.id,
        i_start_ts: slot.start_ts,
        i_end_ts: slot.end_ts,
      });
      if (rpcErr) throw rpcErr;
      if (!orderId) {
        Alert.alert('Reservation error', 'Could not create booking.');
        return;
      }

      // 3. Initiate Stripe Checkout
      await initiateCheckout(orderId as unknown as string);
    } catch (err: any) {
      console.error('[RoomsTab] reserveRoom error', err);
      Alert.alert('Reservation error', err?.message || 'Something went wrong.');
    } finally {
      setReserving(false);
    }
  };

  if (resources.length === 0) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>No rooms found for this property.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <SlotPickerModal
        visible={pickerVisible}
        resourceId={selectedResource?.id ?? null}
        onSelect={handleSlotSelectRoom}
        onClose={() => handleSlotSelectRoom(null)}
      />
      {(reserving || checkoutLoading) && (
        <View style={overlayStyles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={overlayStyles.text}>Preparing checkout...</Text>
        </View>
      )}
    </View>
  );
}

const roomStyles = StyleSheet.create({
  card: {
    backgroundColor: '#35383d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: '#ffd33d',
    fontSize: 18,
    marginBottom: 4,
  },
  desc: {
    color: '#fff',
    marginBottom: 4,
  },
  price: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specs: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ffd33d',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});

const mealStyles = StyleSheet.create({
  card: {
    backgroundColor: '#35383d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: '#ffd33d',
    fontSize: 16,
    marginBottom: 4,
  },
  desc: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#ffd33d',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});

const eventStyles = StyleSheet.create({
  card: {
    backgroundColor: '#35383d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: '#ffd33d',
    fontSize: 18,
    marginBottom: 4,
  },
  desc: {
    color: '#fff',
    marginBottom: 4,
  },
  price: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specs: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ffd33d',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});

const overviewStyles = StyleSheet.create({
  card: {
    backgroundColor: '#35383d',
    borderRadius: 8,
    padding: 16,
  },
});

const cartBarStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#25292e',
    padding: 16,
  },
  timeButton: {
    backgroundColor: '#35383d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  // Highlight styles when no time is selected
  timeButtonHighlight: {
    backgroundColor: '#ffd33d',
  },
  timeTextHighlight: {
    color: '#25292e',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#fff',
  },
  totalText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkout: {
    backgroundColor: '#ffd33d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  checkoutText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});
const webPickerStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#35383d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
function DiningTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mealItems, setMealItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, { item: any; qty: number }>>({});
  const [mealTime, setMealTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [tempHour, setTempHour] = useState<number>(12);
  const [tempMinute, setTempMinute] = useState<number>(0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');
  const [tempDate, setTempDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const { initiateCheckout, loading: checkoutLoading } = useStripeCheckout();
  const session = useSession();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const insets = useSafeAreaInsets();

  const total = Object.values(cart).reduce(
    (sum, { item, qty }) => sum + (Number(item.price) || 0) * qty,
    0
  );

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Get dining service id
        const { data: svc, error: svcErr } = await supabase
          .from('services')
          .select('id')
          .eq('name', 'dining')
          .single();
        if (svcErr) throw svcErr;

        // Dining resources under this property
        const { data: resources, error: resErr } = await supabase
          .from('resources')
          .select('id')
          .eq('property_id', id)
          .eq('service_id', svc.id);
        if (resErr) throw resErr;
        const resourceIds = resources?.map((r) => r.id) || [];
        if (resourceIds.length === 0) {
          setMealItems([]);
          return;
        }

        // Menus belonging to those resources
        const { data: menus, error: menuErr } = await supabase
          .from('menus')
          .select('id')
          .in('resource_id', resourceIds);
        if (menuErr) throw menuErr;
        const menuIds = menus?.map((m) => m.id) || [];
        if (menuIds.length === 0) {
          setMealItems([]);
          return;
        }

        // Meal items for those menus
        const { data: items, error: itemsErr } = await supabase
          .from('meal_items')
          .select('*')
          .in('menu_id', menuIds);
        if (itemsErr) throw itemsErr;
        setMealItems(items || []);
      } catch (err) {
        console.error('[DiningTab] fetch meal items error', err);
        setMealItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: { item, qty: existing ? existing.qty + 1 : 1 },
      };
    });
  };



  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={mealStyles.card}>
        <View style={{ flex: 1 }}>
          <Text style={mealStyles.name}>{item.name}</Text>
          <Text style={mealStyles.desc}>{item.description}</Text>
          <Text style={mealStyles.price}>KES {Number(item.price).toFixed(0)}</Text>
        </View>
        <Pressable style={mealStyles.button} onPress={() => addToCart(item)}>
          <Text style={mealStyles.buttonText}>Add</Text>
        </Pressable>
      </View>
    );
  };

  const placeOrder = async () => {
    console.log('[DiningTab] placeOrder start', { placing, checkoutLoading, total, mealTime, cart });
    if (placing || checkoutLoading) return;

    if (total === 0) {
      Alert.alert('Cart empty', 'Please add items.');
      return;
    }
    if (!mealTime) {
      Alert.alert('Select time', 'Please pick a time to serve the meal.');
      return;
    }
    console.log('[DiningTab] session', session);
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }

    try {
      setPlacing(true);

      // 1. Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          guest_id: session.user.id,
          property_id: id,
          total,
          status: 'initiated',
        })
        .select('id')
        .single();

      console.log('[DiningTab] order insert result', { order, orderErr });
      if (orderErr || !order) {
        throw orderErr || new Error('Failed to create order');
      }

      // 2. Insert order items
      const orderItems = Object.values(cart).map(({ item, qty }) => ({
        order_id: order.id,
        meal_item_id: item.id,
        quantity: qty,
        price: Number(item.price) || 0,
      }));

      if (orderItems.length === 0) {
        throw new Error('No items to order');
      }

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      console.log('[DiningTab] order_items insert', { itemsErr });
      if (itemsErr) throw itemsErr;

      // 3. Initiate Stripe Checkout
      console.log('[DiningTab] initiating checkout');
      await initiateCheckout(order.id);

      // 4. Reset local cart & time on success
      setCart({});
      setMealTime(null);
    } catch (err: any) {
      console.error('[DiningTab] placeOrder error', err);
      Alert.alert('Order error', err?.message || 'Something went wrong.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>Loading menu...</Text>
      </View>
    );
  }

  if (mealItems.length === 0) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>No dining options found.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={mealItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom }}
      />
      {/* Cart bar */}
      <View style={[cartBarStyles.bar, { bottom: insets.bottom }]}>
        <TouchableOpacity
          style={[cartBarStyles.timeButton, !mealTime && cartBarStyles.timeButtonHighlight]}
          onPress={() => {
             if (Platform.OS === 'web') {
               // When no meal time is chosen yet, default the picker to the NEXT top of the hour
               let base = mealTime ? new Date(mealTime) : new Date();
               if (!mealTime) {
                 // Move to next hour and zero the minutes/seconds
                 base.setMinutes(0, 0, 0);
                 base.setHours(base.getHours() + 1);
               }
               const h24 = base.getHours();
               const p = h24 >= 12 ? 'PM' : 'AM';
               const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
               setTempHour(h12);
               setTempPeriod(p as 'AM' | 'PM');
               setTempMinute(base.getMinutes());
               setTempDate(base.toISOString().split('T')[0]);
             }
            setShowPicker(true);
          }}
        >
          <Text style={[cartBarStyles.timeText, !mealTime && cartBarStyles.timeTextHighlight]}>
            {mealTime
              ? mealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Pick Time'}
          </Text>
        </TouchableOpacity>
        <Text style={cartBarStyles.totalText}>KES {total.toFixed(0)}</Text>
        <Pressable
          style={[
            cartBarStyles.checkout,
            { opacity: total === 0 || placing || checkoutLoading || !mealTime ? 0.4 : 1 },
          ]}
          onPress={placeOrder}
          disabled={total === 0 || placing || checkoutLoading || !mealTime}
        >
          <Text style={cartBarStyles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' && showPicker && (
        <View style={webPickerStyles.overlay}>
          <View style={webPickerStyles.modal}>
            <Text style={{ color: '#fff', marginBottom: 8 }}>Select date & time</Text>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate((e.target as HTMLInputElement).value)}
              style={{ marginBottom: 12, fontSize: 16 }}
            />
            <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
              <select
                value={tempHour}
                onChange={(e) => setTempHour(Number((e.target as HTMLSelectElement).value))}
                style={{ marginRight: 6, fontSize: 16 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <Text style={{ color: '#fff' }}>:</Text>
              <select
                value={tempMinute}
                onChange={(e) => setTempMinute(Number((e.target as HTMLSelectElement).value))}
                style={{ marginLeft: 6, fontSize: 16 }}
              >
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={tempPeriod}
                onChange={(e) => setTempPeriod((e.target as HTMLSelectElement).value as 'AM' | 'PM')}
                style={{ marginLeft: 6, fontSize: 16 }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </View>
            <Pressable
              onPress={() => {
                const d = new Date(tempDate + 'T00:00');
                let hr24 = tempHour % 12;
                if (tempPeriod === 'PM') hr24 += 12;
                d.setHours(hr24);
                d.setMinutes(tempMinute);
                d.setSeconds(0);
                setMealTime(d);
                setShowPicker(false);
              }}
              style={{ backgroundColor: '#ffd33d', padding: 8, borderRadius: 4 }}
            >
              <Text style={{ color: '#25292e', fontWeight: 'bold' }}>Set</Text>
            </Pressable>
          </View>
        </View>
      )}
      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={mealTime || new Date()}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowPicker(false);
            if (date) setMealTime(date);
          }}
        />
      )}
    </>
  );
}
function EventsTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const { initiateCheckout, loading: checkoutLoading } = useStripeCheckout();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        // Find event or events service id
        const { data: svcs, error: svcErr } = await supabase
          .from('services')
          .select('id')
          .in('name', ['event', 'events']);
        if (svcErr) throw svcErr;
        const svcId = svcs && svcs.length > 0 ? svcs[0].id : null;
        if (!svcId) {
          setEvents([]);
          return;
        }

        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('property_id', id)
          .eq('service_id', svcId);
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('[EventsTab] fetch events error', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={[tabStyles.content, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.text}>No events listed for this property.</Text>
      </View>
    );
  }

  const bookEvent = async (evt: any) => {
    if (booking || checkoutLoading) return;
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    try {
      setBooking(true);
      // 1. Fetch earliest open availability slot for this event
      console.log('[EventsTab] fetching availability for', evt.id);
      const { data: slots, error: slotErr } = await supabase
        .from('availability')
        .select('start_ts, end_ts')
        .eq('resource_id', evt.id)
        .eq('status', 'open')
        .gt('start_ts', new Date().toISOString())
        .order('start_ts')
        .limit(1);
      if (slotErr) throw slotErr;
      console.log('[EventsTab] availability slots', slots);
      const slot = Array.isArray(slots) && slots.length > 0 ? slots[0] : null;
      if (slotErr) throw slotErr;
      if (!slot) {
        Alert.alert('No availability', 'This event has no available slots.');
        return;
      }

      // 2. Create booking + order via RPC and get order_id
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_booking', {
        i_resource_id: evt.id,
        i_start_ts: slot.start_ts,
        i_end_ts: slot.end_ts,
      });
      if (rpcErr) throw rpcErr;
      if (!orderId) {
        Alert.alert('Booking error', 'Could not create booking.');
        return;
      }

      // 3. Initiate Stripe Checkout
      await initiateCheckout(orderId as unknown as string);
    } catch (err: any) {
      console.error('[EventsTab] bookEvent error', err);
      Alert.alert('Booking error', err?.message || 'Something went wrong.');
    } finally {
      setBooking(false);
    }
  };

  const openPicker = (resource: any) => {
    setSelectedResource(resource);
    setPickerVisible(true);
  };

  const bookEventWithSlot = async (resource: any, slot: AvailabilitySlot) => {
    if (booking || checkoutLoading) return;
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    try {
      setBooking(true);
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_booking', {
        i_resource_id: resource.id,
        i_start_ts: slot.start_ts,
        i_end_ts: slot.end_ts,
      });
      if (rpcErr) throw rpcErr;
      if (!orderId) {
        Alert.alert('Booking error', 'Could not create booking.');
        return;
      }
      await initiateCheckout(orderId as unknown as string);
    } catch (err: any) {
      console.error('[EventsTab] bookEventWithSlot error', err);
      Alert.alert('Booking error', err?.message || 'Something went wrong.');
    } finally {
      setBooking(false);
    }
  };

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setPickerVisible(false);
    if (slot && selectedResource) {
      bookEventWithSlot(selectedResource, slot);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={eventStyles.card}>
      <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={eventStyles.name}>{item.name}</Text>
      <Text style={eventStyles.desc}>{item.description}</Text>
        {item.price != null && (
          <Text style={eventStyles.price}>KES {Number(item.price).toFixed(0)}</Text>
        )}
        {item.specifications && (
          <Text style={eventStyles.specs}>{JSON.stringify(item.specifications)}</Text>
        )}
      </View>
      <Pressable
        style={eventStyles.button}
        disabled={booking || checkoutLoading}
        onPress={() => openPicker(item)}>
        {booking || checkoutLoading ? (
          <ActivityIndicator color="#25292e" />
        ) : (
          <Text style={eventStyles.buttonText}>Book</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <SlotPickerModal
        visible={pickerVisible}
        resourceId={selectedResource?.id ?? null}
        onSelect={handleSlotSelect}
        onClose={() => handleSlotSelect(null)}
      />
      {(booking || checkoutLoading) && (
        <View style={overlayStyles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={overlayStyles.text}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

// overlay styles
const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  text: {
    marginTop: 12,
    color: '#fff',
  },
});

export default function PropertyDetail() {
  const navigationState = useNavigationState((state) => state);

  const currentRouteName = (() => {
    let navState: any = navigationState;
    // Traverse down to the deepest active route (tab) inside property/[id]
    while (navState?.routes && navState.routes[navState.index]?.state) {
      navState = navState.routes[navState.index].state as any;
    }
    return navState?.routes ? navState.routes[navState.index].name : 'Overview';
  })();

  const bookingType: 'room' | 'meal' | 'event' =
    currentRouteName === 'Rooms'
      ? 'room'
      : currentRouteName === 'Dining'
      ? 'meal'
      : currentRouteName === 'Events'
      ? 'event'
      : 'room';

  // Debug logging



  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    if (id) {
      supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => setProperty(data));
    }
  }, [id]);

  if (!property) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => router.back()}
        style={{ position: 'absolute', top: insets.top + 10, left: 16, zIndex: 99 }}
      >
        <Ionicons name="arrow-back" size={28} color="#000" />
      </Pressable>
      <Image source={{ uri: property.image_url }} style={styles.hero} />
      <Tab.Navigator
          initialRouteName="Overview"
          screenOptions={{
            tabBarStyle: { backgroundColor: '#25292e' },
            tabBarActiveTintColor: '#ffd33d',
            tabBarIndicatorStyle: { backgroundColor: '#ffd33d' },
          }}
        >
          <Tab.Screen name="Overview" component={OverviewTab} />
          <Tab.Screen name="Rooms" component={RoomsTab} />
          <Tab.Screen name="Dining" component={DiningTab} />
          <Tab.Screen name="Events" component={EventsTab} />
        </Tab.Navigator>
      
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#25292e',
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    width: Dimensions.get('window').width,
    height: 240,
  },
  /* placeholder unused styles
  title: {},
  text: {},
  */
  text: {
    color: '#fff',
    fontSize: 16,
  },
});

const tabStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
  },
});