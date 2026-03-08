import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { useThemeColor } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export const LegalScreen = ({ navigation }: Props) => {
    const Colors = useThemeColor();

    const handleSupport = () => {
        Linking.openURL('mailto:meetiva.destek@gmail.com');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.bgMain }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yasal Bilgiler ve Politikalar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>I. KULLANICI SÖZLEŞMESİ</Text>
                    <Text style={styles.text}>
                        İşbu Kullanıcı Sözleşmesi, Meetiva dijital platformu üzerinden sunulan hizmetlerden yararlanan tüm gerçek kişilerin (bundan sonra "Kullanıcı" olarak anılacaktır) hak ve yükümlülüklerini belirler.
                    </Text>
                    <Text style={styles.text}>
                        1. Üyelik Şartları: Kullanıcı, kayıt formunda yer alan bilgilerin doğruluğunu taahhüt eder. Reşit olmayan bireyler platformu kullanamaz.{"\n"}
                        2. Fikri Mülkiyet: Meetiva markası, tasarımı ve uygulama içerisindeki tüm yazılımsal kodlar münhasıran platform yönetimine aittir. İzinsiz kopyalanması yasaktır.{"\n"}
                        3. Sorumluluk Sınırı: Meetiva, kullanıcılar arasındaki iletişimi kolaylaştıran bir platformdur; kullanıcıların şahsi beyanlarından veya eylemlerinden doğrudan sorumlu tutulamaz.
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>II. KVKK AYDINLATMA METNİ</Text>
                    <Text style={styles.text}>
                        6698 Sayılı Kişisel Verilerin Korunması Kanunu uyarınca Veri Sorumlusu sıfatıyla, Meetiva tarafından işlenen kişisel verileriniz hakkında bilgilendirmeyi içerir.
                    </Text>
                    <Text style={styles.text}>
                        • Veri İşleme Amacı: Kimlik ve iletişim verileriniz, uygulama algoritması üzerinden eşleşme sağlanması ve hizmet kalitesinin optimizasyonu amacıyla işlenmektedir.{"\n"}
                        • Veri Saklama: Verileriniz, üyeliğiniz süresince bulut tabanlı şifrelenmiş sunucularda muhafaza edilir ve yasal süresi sonunda anonimleştirilerek imha edilir.{"\n"}
                        • Haklarınız: KVKK Madde 11 uyarınca, verilerinizin düzeltilmesini, silinmesini veya işlenip işlenmediği bilgisini talep etme hakkınız saklıdır.
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>III. GİZLİLİK VE KONUM POLİTİKASI</Text>
                    <Text style={styles.text}>
                        Konum verileriniz, yalnızca kullanıcı tarafından "Arama" başlatıldığında işleme alınır. Meetiva, arka planda izinsiz konum takibi yapmamaktadır. Arama sonlandırıldığında kesin konum verileriniz sunucularımızdan silinir; yalnızca istatistiksel amaçla bölge verisi tutulur.
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.text}>
                        Bu belgeler periyodik olarak güncellenebilir. Platformu kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.
                    </Text>
                </View>

                <TouchableOpacity style={styles.supportBtn} onPress={handleSupport}>
                    <Text style={styles.supportBtnText}>Hukuki süreçler için: meetiva.destek@gmail.com</Text>
                </TouchableOpacity>

                <Text style={styles.footerVersion}>Meetiva Hukuk Birimi • v0.0.1</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a202c',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ea2a33',
        marginBottom: 14,
        letterSpacing: 1.2,
    },
    text: {
        fontSize: 13,
        color: '#444',
        lineHeight: 21,
        marginBottom: 12,
        textAlign: 'justify',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginBottom: 24,
    },
    supportBtn: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8f6f6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#edf2f7',
        alignItems: 'center',
    },
    supportBtnText: {
        fontSize: 13,
        color: '#718096',
        fontWeight: '600',
    },
    footerVersion: {
        textAlign: 'center',
        marginTop: 32,
        fontSize: 11,
        color: '#a0aec0',
        letterSpacing: 0.5,
    }
});
