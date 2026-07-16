plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "ir.fitino.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "ir.fitino.app"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        resValue("string", "app_name", "فیتینو")
    }

    flavorDimensions += "store"
    productFlavors {
        create("myket") {
            dimension = "store"
            applicationIdSuffix = ".myket"
            resValue("string", "app_name", "فیتینو")
            resValue("string", "store_channel", "myket")
        }
        create("bazaar") {
            dimension = "store"
            applicationIdSuffix = ".bazaar"
            resValue("string", "app_name", "فیتینو")
            resValue("string", "store_channel", "bazaar")
        }
        create("play") {
            dimension = "store"
            resValue("string", "app_name", "فیتینو")
            resValue("string", "store_channel", "play")
        }
        create("appstore") {
            dimension = "store"
            applicationIdSuffix = ".appstore"
            resValue("string", "app_name", "فیتینو")
            resValue("string", "store_channel", "appstore")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
