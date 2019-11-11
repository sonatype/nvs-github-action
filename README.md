# NVS for GitHub Actions

🎉🎉🎉 GitHub Universe preview of the Nexus Vulnerability Scanner for GitHub Actions 🎉🎉🎉<br><br>This is a limited run for GitHub Universe and will be used to better inform our product direction. Usage of this service is subject to the [Terms of Service](terms-of-service.md). If you do not accept the terms do not use NVS for GitHub Actions.|
 :---- |

NVS for GitHub Actions generates a Software Bill of Materials during the Actions workflow. The Software Bill of Materials uses Nexus Intelligence to provide information on the open source components that compose your application including security vulnerabilities, applicable licenses, and architectural data. For more information, take a look at a sample [Nexus Vulnerability Scan](https://cdn2.hubspot.net/hubfs/1958393/eBooks/AHC_Guide.pdf).

## Inputs

### `email`

**Required** Where to send Nexus Vulnerability Scan after scan is complete.

### `password`

**Required** Password to access Nexus Vulnerability Scan.

### `directory`

**Required** Directory containing the application and dependencies to scan.

## Example Usage

The Nexus Vulnerability Scanner supports several ecosystems including Java, Go, JavaScript, Python, Ruby, NuGet, and [more](https://www.sonatype.com/languages-packages). Dependent on the ecosystem, other workflow actions may be necessary to prepare the application for analysis.

### Java

Java applications should be scanned alongside their dependencies. For obfuscated or not bundled applications, the Maven depedencies plugin can be used to copy dependencies into the target directory for scanning.

```
name: Maven with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Set up JDK 1.8
      uses: actions/setup-java@v1
      with:
        java-version: 1.8
    - name: Build with Maven
      run: mvn package dependency:copy-dependencies
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./target/
```

For application bundles such as `.war`, `.ear` , `.sar` or fat `.jar`s, the packaged application can be scanned.

```
name: Maven with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Set up JDK 1.8
      uses: actions/setup-java@v1
      with:
        java-version: 1.8
    - name: Build with Maven
      run: mvn package
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./target/
```

### Golang

Golang applications should use Go Modules and include the `go.sum` file.

```
name: Golang with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./
```

### JavaScript

For best results, the `node_modules` directory should be installed when scanning Javascript applications.

```
name: Node.js with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - uses: actions/setup-node@v1
      with:
        node-version: '10.x'
    - name: Build with npm
      run: npm ci
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./
```

### Python

Python applications should use pip and include the `requirements.txt` file.

```
name: Python with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./
```

### Ruby

For best results, the `vendor/cache` directory should be installed when scanning Ruby applications.

```
name: Ruby with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Setup Ruby
      uses: actions/setup-ruby@v1
      with:
        ruby-version: 2.6.x
    - name: Install dependencies
      run: |
        gem install bundler
        bundle install
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./
```

### .NET Core

.NET Core applications should `restore` dependencies or `build` application prior to scanning.

```
name: .NET Core with NVS

on: [push]
  branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    - name: Setup .NET Core
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 2.2.108
    - name: Build with dotnet
      run: dotnet build
    - name: Nexus Vulnerability Scanner
      uses: sonatype/nvs-github-action@releases/v1.0.0
      with:
        email: your@mail.com
        password: ${{ secrets.NVS_SCANNER_PASSWORD }}
        directory: ./
```