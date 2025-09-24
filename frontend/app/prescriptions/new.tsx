import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const mockDispensers = [
  {
    id: '1',
    name: 'Dispenser 1',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBibrR3QXNr8JXSsahSxXVqtFJ2gFVtuH_akl71fDZ1fKlkU8I7yuyUQTCoJUeBEm8B_G-hv0HaPVV55o5qsmMdbE7oyEdDlvKmsZ_WXZxmqvLTQPaZvF_ESvMfbezZFYI_O3AIVa8DkHpJDde8TkO3gIZu-WsXbsJsXOzj4OB-SEKvvgMRrrZyEgmNxKenG_e-wlEShFM22f3vFYS2xPhrBOoGE-jOIlX-uf7V9GL-ItzPczZ0OziKuPRw7uN026iMHNVZVwtdSkk',
  },
  {
    id: '2',
    name: 'Dispenser 2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpMw5KkmsTd-d62SnedHyWUkJjiQqwYOubBn2YdVlA1x_ck9Czo8ZOyKoZOEwAV_Z6cCywMVGRhQPxbpo0blq8Tdrx7BuxJMpjnZmdbTCeoE-ejDwbEtDZJ3rZZJ7h-hyEHLJaCMGnSGni1DTLKwveji17POc1sMXkKaMApZ9Ld2n_KoNVmfUKQcHfZdqRj0Z_F-Bv3V8bp2cClh71lgSx43_ZVwH223vsczBiczvspt9yaRxfe05bfZ-Q56hKHEjIzgAdtcyos6A',
  },
];

const mockCompartments = [
  {
    id: '1',
    name: 'Compartment 1',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQCDSsKngDS8ZAQ3hUY4sImCddzGxp8qGUDQGAfr4RsHQy_xZpZrn0_r70tEgFRjnrt2VOdcab6CPkur4r6ixyLt58aCJgx2qUtIBA8QLCGzN0AqUM82VS4mjbSf82LEmDZZah_mfCMmlzTDPZJblfM52sx3BZwwnu32kTgaSbXTy0TVhP37uthPhE99dkhdEMAc-Kldva0Vesx5S8ca1JugfJk2s-BiDpVu3HPyh0u69Ax7aI9x2YWuXotESjDdi5IwTNYXDNgX8',
  },
  {
    id: '2',
    name: 'Compartment 2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAh3fKJUf4F-LDPoMD2IUvSjVrqcT3cscvoeHsaOcZuHm3XuaQc3aZVkK5GXQh7k9BQP7USxDCeki1Oj71blfGmyWvyiKCfeCtp3PDqtN6-HJ-4JM8tiz06GHxwYUxYyNXRhv4wWxVbJbmjvjkrfb1kSqc8Tf_Sa_FSF1pa9B-iSwyVc--yKkoc_aa-9DH4bz61Sbdj3KwnR2SvS8-P4r6wrFc0E8W1CdtSI1lzm15h1OO8aN8_GP89911hsutNk0gVrnSc9qa0F6w',
  },
  {
    id: '3',
    name: 'Compartment 3',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8xpJLgP4bDGrAzmMV8svPaD1Ne53r9p94fsduN_59ytPOGvnumdQc9l5_AFAik5qYUVRGEA1eGI1WKnWhi67mbgVJ3rbaLLiQHjx-ZxSzn-tWYaHXRycadlpdncQLb_ySZ_a6eIHOXQ3rItjIVlWpvtmOa61FF_a-EqGfANvWlIk7342Dk3INbdqccbCCOIlN8qCCivCerY4RO8uuzmlPGCFA8mSA4ViXnz4kD2oY7SLhvLnW3UVv8rYW3P2kMqPz65XfQgkun50',
  },
  {
    id: '4',
    name: 'Compartment 4',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBakflF4QCVjxTp20SQObTerBagtBRzUSvb4VtFBTmz53ZRuHC-n_CD0JwJZG1H1amH6TYu9Mlanxd2ErnXucdXCZNrAYzrH4oEwP8AO0LK8Yqc30BCGXxoP8-E7fa1UsWb46xF7H6oaZbGQamU5PlN4zDlz_k50UoVp6WJB1_AMR-PMpmjqu9hhHgEZIHqxIbz66CEkh3IYhbawF2747YBWSOk4Hlw25NCWpcSooiXO-OYn3ahLruSxpf81u1kcWHRuCdAS7XxLK8',
  },
  {
    id: '5',
    name: 'Compartment 5',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzNT42eXyFNUyhQvln2A0cLcSIfkp-G7aRm3L7B2WFucV2Lw15BCekUZaWdg4_zkdUmvLworHvqw7veo8wgawb7GUhl5Sg4lnoOmiPuqcGSkZP1cqhpJ9TSy6Y1XWZeegmpbQiVJBED0pB9IDgViHkJL_ZjNoalo3xnRAr5UpreMSqDHjSMevjN3LpPG5x3XFgo07sVqO2aUHldGi2oKIa5Jo3SAQrLXZu-L21DkmKG6R59Ag0YQsmRo53NqJ0GxeiGbV-_ZLkf10',
  },
  {
    id: '6',
    name: 'Compartment 6',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHMx_TUbfltebYUFXQgN6kDkxNRsyeoP1YrYC0KoZ7o-BYI4SRLhb9h1E4gzq-SDfTWuBry7_0EZS2Wa8AplNMwvHW78ZVnxm47XWpp7gFZO6I0jhnnhpC1tA18CyMbjU66tAyMFuihmkxrmZWxKxfjyPmDzWNDPJMeoQKmx_EkLi3mBeUYAUVrSF2Zc8WjCExzs8qDL-6UQf7OJkq_oS3fy4ZQTEk1l6cT9bzxg15HPXLN4epKSOuMY986L1fekNlJRv2t4wZ61I',
  },
];

export default function NewPrescriptionScreen() {
  const [selectedDispenser, setSelectedDispenser] = useState<string | null>('1');
  const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);

  const handleClose = () => {
    router.back();
  };

  const handleNext = () => {
    if (selectedDispenser && selectedCompartment) {
      // Mock navigation to next step - for now go back to prescriptions
      router.push('/prescriptions');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Prescription</Text>
          <View style={styles.spacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Select Dispenser */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your dispenser</Text>
            <View style={styles.dispenserGrid}>
              {mockDispensers.map((dispenser) => (
                <TouchableOpacity 
                  key={dispenser.id}
                  style={[
                    styles.dispenserItem,
                    selectedDispenser === dispenser.id && styles.dispenserItemSelected
                  ]}
                  onPress={() => setSelectedDispenser(dispenser.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dispenserImageContainer}>
                    <Image
                      source={{ uri: dispenser.image }}
                      style={styles.dispenserImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.dispenserName}>{dispenser.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Select Compartments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select compartments</Text>
            <View style={styles.compartmentGrid}>
              {mockCompartments.map((compartment) => (
                <TouchableOpacity 
                  key={compartment.id}
                  style={[
                    styles.compartmentItem,
                    selectedCompartment === compartment.id && styles.compartmentItemSelected
                  ]}
                  onPress={() => setSelectedCompartment(compartment.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.compartmentImageContainer}>
                    <Image
                      source={{ uri: compartment.image }}
                      style={styles.compartmentImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.compartmentName}>{compartment.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              (!selectedDispenser || !selectedCompartment) && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!selectedDispenser || !selectedCompartment}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.nextButtonText,
              (!selectedDispenser || !selectedCompartment) && styles.nextButtonTextDisabled
            ]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 36,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#13a4ec',
  },
  progressDotInactive: {
    backgroundColor: '#d1d5db',
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  dispenserGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  dispenserItem: {
    flex: 1,
    alignItems: 'center',
  },
  dispenserItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  dispenserImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dispenserImage: {
    width: '100%',
    height: '100%',
  },
  dispenserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  compartmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  compartmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '47%',
  },
  compartmentItemSelected: {
    backgroundColor: '#13a4ec10',
    borderColor: '#13a4ec',
  },
  compartmentImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  compartmentImage: {
    width: '100%',
    height: '100%',
  },
  compartmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    paddingBottom: 48,
    backgroundColor: '#f6f7f8',
  },
  nextButton: {
    backgroundColor: '#13a4ec',
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13a4ec',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
});