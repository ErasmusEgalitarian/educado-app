const {
  withAndroidManifest,
  withDangerousMod,
  withGradleProperties,
} = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

// ────────────────────────────────────────────
// 1. network_security_config.xml
// ────────────────────────────────────────────
const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">10.0.2.2</domain>
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">172.16.0.0</domain>
    </domain-config>
    <debug-overrides cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>`

// ────────────────────────────────────────────
// 2. backup_rules.xml (API < 31)
// ────────────────────────────────────────────
const BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="." />
    <exclude domain="database" path="." />
    <exclude domain="file" path="secure_storage/" />
</full-backup-content>`

// ────────────────────────────────────────────
// 3. data_extraction_rules.xml (API 31+)
// ────────────────────────────────────────────
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="." />
        <exclude domain="database" path="." />
        <exclude domain="file" path="secure_storage/" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="." />
        <exclude domain="database" path="." />
        <exclude domain="file" path="secure_storage/" />
    </device-transfer>
</data-extraction-rules>`

// ────────────────────────────────────────────
// 4. ProGuard rules
// ────────────────────────────────────────────
const EXTRA_PROGUARD_RULES = `
# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# expo-secure-store
-keep class expo.modules.securestore.** { *; }

# expo-video
-keep class expo.modules.video.** { *; }

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
`

function writeXmlFile(projectDir, filename, content) {
  const xmlDir = path.join(
    projectDir,
    'android',
    'app',
    'src',
    'main',
    'res',
    'xml'
  )
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.writeFileSync(path.join(xmlDir, filename), content)
}

function appendProguardRules(projectDir) {
  const proguardPath = path.join(
    projectDir,
    'android',
    'app',
    'proguard-rules.pro'
  )
  if (fs.existsSync(proguardPath)) {
    const existing = fs.readFileSync(proguardPath, 'utf-8')
    if (!existing.includes('expo-secure-store')) {
      fs.appendFileSync(proguardPath, EXTRA_PROGUARD_RULES)
    }
  }
}

const withAndroidSecurity = (config) => {
  // Write XML resource files
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      writeXmlFile(cfg.modRequest.projectRoot, 'network_security_config.xml', NETWORK_SECURITY_CONFIG)
      writeXmlFile(cfg.modRequest.projectRoot, 'backup_rules.xml', BACKUP_RULES)
      writeXmlFile(cfg.modRequest.projectRoot, 'data_extraction_rules.xml', DATA_EXTRACTION_RULES)
      appendProguardRules(cfg.modRequest.projectRoot)
      return cfg
    },
  ])

  // Update AndroidManifest.xml <application> attributes
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0]
    if (app) {
      app.$['android:allowBackup'] = 'false'
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config'
      app.$['android:fullBackupContent'] = '@xml/backup_rules'
      app.$['android:dataExtractionRules'] = '@xml/data_extraction_rules'
      // Remove deprecated flag
      delete app.$['android:requestLegacyExternalStorage']
    }

    // Scope deprecated storage permissions to API 32 max
    const permissions = cfg.modResults.manifest['uses-permission'] || []
    for (const perm of permissions) {
      const name = perm.$['android:name']
      if (
        name === 'android.permission.READ_EXTERNAL_STORAGE' ||
        name === 'android.permission.WRITE_EXTERNAL_STORAGE'
      ) {
        perm.$['android:maxSdkVersion'] = '32'
      }
    }

    // Remove permissions not needed for this app
    cfg.modResults.manifest['uses-permission'] = permissions.filter((perm) => {
      const name = perm.$['android:name']
      return (
        name !== 'android.permission.RECORD_AUDIO' &&
        name !== 'android.permission.ACCESS_MEDIA_LOCATION' &&
        name !== 'android.permission.READ_MEDIA_AUDIO'
      )
    })

    return cfg
  })

  // Enable R8 minification and resource shrinking for release builds
  config = withGradleProperties(config, (cfg) => {
    const set = (key, value) => {
      const idx = cfg.modResults.findIndex((p) => p.key === key)
      const entry = { type: 'property', key, value }
      if (idx >= 0) cfg.modResults[idx] = entry
      else cfg.modResults.push(entry)
    }
    set('android.enableMinifyInReleaseBuilds', 'true')
    set('android.enableShrinkResourcesInReleaseBuilds', 'true')
    return cfg
  })

  return config
}

module.exports = withAndroidSecurity
