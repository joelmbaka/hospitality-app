import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export interface AvailabilitySlot {
  id: string;
  start_ts: string;
  end_ts: string;
}

interface Props {
  visible: boolean;
  resourceId: string | null;
  onSelect: (slot: AvailabilitySlot | null) => void;
  onClose: () => void;
}

const SlotPickerModal: React.FC<Props> = ({ visible, resourceId, onSelect, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    if (!visible || !resourceId) return;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('availability')
          .select('id, start_ts, end_ts')
          .eq('resource_id', resourceId)
          .eq('status', 'open')
          .gt('start_ts', new Date().toISOString())
          .order('start_ts');
        if (error) throw error;
        setSlots((data as AvailabilitySlot[]) || []);
      } catch (err) {
        console.error('[SlotPickerModal] fetch slots error', err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, resourceId]);

  const formatSlot = (slot: AvailabilitySlot) => {
    const start = new Date(slot.start_ts);
    const end = new Date(slot.end_ts);
    const dateStr = start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `${dateStr}  ${timeStr}`;
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.heading}>Select a Slot</Text>
          {loading ? (
            <ActivityIndicator color="#ffd33d" />
          ) : slots.length === 0 ? (
            <Text style={styles.text}>No available slots.</Text>
          ) : (
            <FlatList
              data={slots}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.slot} onPress={() => onSelect(item)}>
                  <Text style={styles.text}>{formatSlot(item)}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 300, width: '100%' }}
            />
          )}
          <Pressable style={styles.closeBtn} onPress={() => onClose()}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default SlotPickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#35383d',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  heading: {
    color: '#ffd33d',
    fontSize: 18,
    marginBottom: 12,
  },
  text: {
    color: '#fff',
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    width: '100%',
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#ffd33d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  closeText: {
    color: '#25292e',
    fontWeight: 'bold',
  },
});
