import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGlobalLeaderboard } from '@/hooks/useLeaderboard'
import { t } from '@/i18n/config'
import { getCurrentLanguage } from '@/i18n/config'
import { ApiLeaderboardEntry, getAuthHeaders, getImageUrl } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
}
const MONTH_NAMES_EN: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
}

function getMonthName(month: string): string {
  const mm = month.split('-')[1]
  return (getCurrentLanguage() === 'pt-BR' ? MONTH_NAMES_PT : MONTH_NAMES_EN)[mm] ?? month
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

type ListItem = ApiLeaderboardEntry | { type: 'dots' }

export default function RankingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()
  const { user, token } = useAuth()

  const { data: leaderboard, isLoading, refetch } = useGlobalLeaderboard()

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const entries = leaderboard?.entries ?? []
  const userRank = leaderboard?.userRank

  const { top3, listEntries } = useMemo(() => {
    const hasPodium = entries.length >= 3
    const podium = hasPodium ? entries.slice(0, 3) : []
    const rest = hasPodium ? entries.slice(3) : [...entries]
    const userOutside = userRank && userRank.rank > 30

    if (userOutside) {
      const firstThree = rest.slice(0, 3)
      return {
        top3: podium,
        listEntries: [...firstThree, { type: 'dots' as const }, userRank] as ListItem[],
      }
    }
    return { top3: podium, listEntries: rest as ListItem[] }
  }, [entries, userRank])

  const monthName = leaderboard?.month ? getMonthName(leaderboard.month) : ''

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#141B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('leaderboard.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Month subtitle */}
        {monthName ? (
          <Text style={styles.monthSub}>
            Ranking referente ao mês de{' '}
            <Text style={{ fontWeight: '600' }}>{monthName}</Text>
          </Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="large" color="#246670" style={{ marginTop: 80 }} />
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={80} color="#809CAD" />
            <Text style={styles.emptyText}>{t('leaderboard.noData')}</Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            {top3.length === 3 && (
              <View style={styles.podium}>
                {/* 2nd place - left */}
                <PodiumSlot entry={top3[1]} position={2} token={token} />
                {/* 1st place - center */}
                <PodiumSlot entry={top3[0]} position={1} token={token} />
                {/* 3rd place - right */}
                <PodiumSlot entry={top3[2]} position={3} token={token} />
              </View>
            )}

            {/* List */}
            {listEntries.map((item, i) => {
              if ('type' in item) {
                return (
                  <View key="dots">
                    <View style={styles.dotsRow}>
                      <Text style={styles.dot}>.</Text>
                      <Text style={styles.dot}>.</Text>
                      <Text style={styles.dot}>.</Text>
                    </View>
                    <View style={styles.sep} />
                  </View>
                )
              }
              const entry = item as ApiLeaderboardEntry
              const highlighted = entry.userId === user?.id
              return (
                <View key={entry.userId + i}>
                  <View style={[styles.row, highlighted && styles.rowHl]}>
                    <Text style={[styles.rowRank, highlighted && styles.hlText]}>
                      {entry.rank}
                    </Text>
                    {entry.avatarMediaId ? (
                      <Image
                        source={{ uri: getImageUrl(entry.avatarMediaId), headers: getAuthHeaders(token) }}
                        style={[styles.rowAvatar, highlighted && styles.rowAvatarHl]}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.rowAvatar, highlighted && styles.rowAvatarHl]}>
                        <Text style={[styles.rowAvatarText, highlighted && styles.hlAvatarText]}>
                          {getInitials(entry.firstName, entry.lastName)}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[styles.rowName, highlighted && styles.hlText]}
                      numberOfLines={1}
                    >
                      {entry.firstName} {entry.lastName}
                    </Text>
                    <Text style={[styles.rowPts, highlighted && styles.hlTextRegular]}>
                      {entry.points} pts
                    </Text>
                  </View>
                  <View style={styles.sep} />
                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function PodiumSlot({ entry, position, token }: { entry: ApiLeaderboardEntry; position: 1 | 2 | 3; token: string | null }) {
  const isFirst = position === 1
  const size = isFirst ? 82 : 70

  return (
    <View style={[styles.podSlot, { marginTop: isFirst ? 0 : 45 }]}>
      <Text style={styles.podPts}>{entry.points} pts</Text>
      {entry.avatarMediaId ? (
        <Image
          source={{ uri: getImageUrl(entry.avatarMediaId), headers: getAuthHeaders(token) }}
          style={[styles.podCircle, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.podCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.podInitials, { fontSize: isFirst ? 18 : 16 }]}>
            {getInitials(entry.firstName, entry.lastName)}
          </Text>
        </View>
      )}
      <View style={styles.podBadge}>
        <Text style={styles.podBadgeText}>{position}º</Text>
      </View>
      <Text style={styles.podName} numberOfLines={1}>
        {entry.firstName}{'\n'}{entry.lastName}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFEFF' },
  scroll: { paddingHorizontal: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '400', color: '#141B1F', textAlign: 'center', flex: 1 },

  // Month
  monthSub: { fontSize: 14, color: '#141B1F', lineHeight: 18.2, marginBottom: 30 },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 30,
    gap: 16,
  },
  podSlot: { alignItems: 'center', width: 104 },
  podPts: { fontSize: 14, fontWeight: '700', color: '#141B1F', marginBottom: 6 },
  podCircle: { backgroundColor: '#4A90A4', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  podInitials: { fontWeight: '700', color: '#FDFEFF' },
  podBadge: {
    backgroundColor: '#FAC12F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: -14,
    zIndex: 1,
  },
  podBadgeText: { fontSize: 12, fontWeight: '700', color: '#141B1F' },
  podName: { fontSize: 18, fontWeight: '700', color: '#141B1F', marginTop: 6, textAlign: 'center' },

  // List row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    gap: 15,
  },
  rowHl: { backgroundColor: '#246670', borderRadius: 8 },
  rowRank: { fontSize: 18, fontWeight: '700', color: '#141B1F', minWidth: 20, textAlign: 'center' },
  rowAvatar: {
    width: 51, height: 51, borderRadius: 60,
    backgroundColor: '#D8EFF3', borderWidth: 3, borderColor: '#FDFEFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  rowAvatarHl: { backgroundColor: '#4A90A4' },
  rowAvatarText: { fontSize: 14, fontWeight: '600', color: '#4E6879' },
  rowName: { flex: 1, fontSize: 18, fontWeight: '400', color: '#141B1F', lineHeight: 23.4 },
  rowPts: { fontSize: 14, fontWeight: '400', color: '#141B1F', lineHeight: 18.2 },

  // Highlighted text
  hlText: { color: '#FDFEFF', fontWeight: '700' },
  hlTextRegular: { color: '#FDFEFF' },
  hlAvatarText: { color: '#FDFEFF' },

  // Separator
  sep: { height: 1, backgroundColor: '#C1CFD7' },

  // Dots
  dotsRow: { alignItems: 'center', paddingVertical: 10 },
  dot: { fontSize: 32, fontWeight: '700', color: '#809CAD', lineHeight: 16 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 16, color: '#809CAD', textAlign: 'center', lineHeight: 24 },
})
