import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { type FC, memo, useCallback } from 'react';
import type { Languages } from '@/lib/types';

interface LanguageModalProps {
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  actualLanguage: Languages;
  languages: Languages[];
  translationLang: Languages | null;
  setTranslationLang: (lang: Languages | null) => void;
}

const LanguageModal: FC<LanguageModalProps> = ({
  isModalVisible,
  setModalVisible,
  actualLanguage,
  languages,
  translationLang,
  setTranslationLang
}) => {
  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, [setModalVisible]);

  const handleSelect = useCallback((lang: Languages | null) => {
    setTranslationLang(lang);
    handleClose()
  }, [setTranslationLang, handleClose]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isModalVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Translation</Text>

          <ScrollView style={{ maxHeight: 300 }}>
            <TouchableOpacity
              style={[styles.modalOption, !translationLang && styles.selectedOption]}
              onPress={() => handleSelect(null)}
            >
              <Text style={styles.modalOptionText}>None</Text>
            </TouchableOpacity>

            {languages
              .filter((lang) => actualLanguage.toLowerCase() !== lang.toLowerCase())
              .map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.modalOption, translationLang === lang && styles.selectedOption]}
                  onPress={() => handleSelect(lang)}
                >
                  <Text style={styles.modalOptionText}>{lang.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalOptionText: {
    color: '#FFF',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#444',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});

export default memo(LanguageModal);
