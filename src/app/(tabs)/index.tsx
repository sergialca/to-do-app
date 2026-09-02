import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

function defaultDueDate() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function formatDueDate(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setTitle('');
    setDescription('');
    setDueDate(defaultDueDate());
    setShowDatePicker(false);
    setShowTimePicker(false);
    setFormError(null);
    setIsSubmitting(false);
  }

  function openForm() {
    resetForm();
    setIsFormVisible(true);
  }

  function closeForm() {
    setIsFormVisible(false);
    resetForm();
  }

  async function handleContinue() {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const userId = session?.user.id;

    if (!userId) {
      setFormError('You must be signed in to create a task.');
      return;
    }

    if (!trimmedTitle) {
      setFormError('Title is required.');
      return;
    }

    const payload = {
      user_id: userId,
      title: trimmedTitle,
      description: trimmedDescription.length > 0 ? trimmedDescription : null,
      due_date: dueDate.toISOString(),
    };

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error } = await supabase.from('tasks').insert(payload);

      if (error) {
        throw new Error(error.message);
      }

      // Keep a local copy of the payload that was saved.
      await fetch('/api/create-task-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          description: payload.description ?? '',
        }),
      }).catch(() => {
        // Logging is best-effort and should not block task creation.
      });

      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
      setIsSubmitting(false);
    }
  }

  function openDueDatePicker() {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
      return;
    }

    setShowDatePicker((value) => !value);
  }

  function onDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);

      if (event.type !== 'set' || !selectedDate) {
        return;
      }

      const next = new Date(dueDate);
      next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDueDate(next);
      setShowTimePicker(true);
      return;
    }

    if (selectedDate) {
      setDueDate(selectedDate);
    }
  }

  function onTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowTimePicker(false);

    if (event.type !== 'set' || !selectedDate) {
      return;
    }

    const next = new Date(dueDate);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    setDueDate(next);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ThemedText type="subtitle">Tasks</ThemedText>
        <ThemedText themeColor="textSecondary">Your to-dos will show up here.</ThemedText>
      </SafeAreaView>

      <Pressable
        accessibilityLabel="Add task"
        accessibilityRole="button"
        onPress={openForm}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.text,
            opacity: pressed ? 0.8 : 1,
            bottom: BottomTabInset + Spacing.four,
          },
        ]}>
        <ThemedText style={[styles.fabLabel, { color: theme.background }]}>+</ThemedText>
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={closeForm}
        presentationStyle="pageSheet"
        transparent={Platform.OS === 'android'}
        visible={isFormVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.modalContainer,
            Platform.OS === 'android' && styles.modalContainerAndroid,
          ]}>
          <ThemedView style={styles.modalSheet}>
            <SafeAreaView edges={['bottom']} style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">New task</ThemedText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={closeForm}>
                  <ThemedText type="linkPrimary">Cancel</ThemedText>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled">
                <View style={styles.field}>
                  <ThemedText themeColor="textSecondary">Title</ThemedText>
                  <TextInput
                    autoFocus
                    onChangeText={setTitle}
                    placeholder="What do you need to do?"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                      },
                    ]}
                    value={title}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText themeColor="textSecondary">Description</ThemedText>
                  <TextInput
                    multiline
                    onChangeText={setDescription}
                    placeholder="Add more details"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.input,
                      styles.descriptionInput,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                      },
                    ]}
                    textAlignVertical="top"
                    value={description}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText themeColor="textSecondary">Due date</ThemedText>

                  {Platform.OS === 'web' ? (
                    <TextInput
                      onChangeText={(value) => {
                        if (!value) return;
                        setDueDate(new Date(value));
                      }}
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                        },
                      ]}
                      value={toDateTimeLocalValue(dueDate)}
                      {...({ type: 'datetime-local' } as object)}
                    />
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        onPress={openDueDatePicker}
                        style={[
                          styles.input,
                          styles.dueDateButton,
                          { backgroundColor: theme.backgroundElement },
                        ]}>
                        <ThemedText>{formatDueDate(dueDate)}</ThemedText>
                      </Pressable>

                      {showDatePicker ? (
                        <DateTimePicker
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                          onChange={onDateChange}
                          value={dueDate}
                        />
                      ) : null}

                      {showTimePicker ? (
                        <DateTimePicker
                          display="default"
                          mode="time"
                          onChange={onTimeChange}
                          value={dueDate}
                        />
                      ) : null}
                    </>
                  )}
                </View>

                {formError ? (
                  <ThemedText themeColor="textSecondary">{formError}</ThemedText>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={handleContinue}
                  style={({ pressed }) => [
                    styles.submitButton,
                    {
                      backgroundColor: theme.text,
                      opacity: isSubmitting || pressed ? 0.7 : 1,
                    },
                  ]}>
                  <ThemedText style={[styles.submitLabel, { color: theme.background }]}>
                    {isSubmitting ? 'Saving…' : 'Continue'}
                  </ThemedText>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainerAndroid: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalSheet: {
    flex: Platform.OS === 'ios' || Platform.OS === 'web' ? 1 : undefined,
    maxHeight: Platform.OS === 'android' ? '90%' : undefined,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.four,
  },
  modalSafeArea: {
    flex: Platform.OS === 'android' ? undefined : 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  modalContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  descriptionInput: {
    minHeight: 100,
  },
  dueDateButton: {
    justifyContent: 'center',
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: Spacing.three,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
