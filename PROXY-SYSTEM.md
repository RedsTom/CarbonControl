# Système de Proxy pour CarbonControl

## Vue d'ensemble

Le système utilise le **serveur Next.js standard** avec l'App Router pour gérer les communications avec l'imprimante :

1. **WebSocket direct** - Le client web se connecte directement à l'imprimante via WebSocket
2. **Proxy Upload** - Les uploads de fichiers passent par l'API Next.js (`/api/proxy-upload`)
3. **Proxy Vidéo** - Le streaming vidéo passe par l'API Next.js (`/api/video-proxy`)
4. **Ports configurables** - Les ports WebSocket (3030) et Vidéo (3031) sont configurables depuis l'interface

## Architecture

```
Client Web (Navigateur)
    ↓ WebSocket direct
Imprimante (Port 3030)

Client Web (Navigateur)
    ↓ HTTP POST
API Upload Proxy (/api/proxy-upload)
    ↓ HTTP POST
Imprimante Upload Endpoint

Client Web (Navigateur)
    ↓ HTTP GET
API Video Proxy (/api/video-proxy)
    ↓ HTTP Stream
Imprimante (Port 3031)
```

## Démarrage

**Une seule commande :**
```bash
npm run dev
```

Ou double-cliquez sur `start.bat` sous Windows.

Cette commande démarre le serveur Next.js standard sur le port 3000.

## Configuration

### Ports par défaut
- **Next.js** : 3000
- **Imprimante WebSocket** : 3030 (configurable dans l'interface)
- **Imprimante Vidéo** : 3031 (configurable dans l'interface)

### Variables d'environnement
Créez un fichier `.env.local` si nécessaire :

```env
# Port du serveur Next.js (optionnel, défaut 3000)
PORT=3000
```

## Fonctionnalités

### 1. Configuration des ports
Dans l'interface, vous pouvez configurer :
- **IP de l'imprimante**
- **Port WebSocket** (par défaut 3030)
- **Port Vidéo** (par défaut 3031)

Ces paramètres sont sauvegardés dans le localStorage du navigateur.

### 2. Connexion WebSocket directe
Le client se connecte directement à l'imprimante via WebSocket :
- Moins de latence
- Pas d'intermédiaire pour les commandes temps réel
- Reconnexion automatique

### 3. Upload via proxy API
Les fichiers passent par `/api/proxy-upload` :
- Gestion correcte des fichiers multipart
- Support des gros fichiers
- Pas de problèmes CORS

### 4. Streaming vidéo via proxy
Le flux vidéo passe par `/api/video-proxy` :
- Le client demande le flux au serveur Next.js
- Le serveur récupère le flux de l'imprimante
- Le serveur le transmet au client
- Pas de problèmes CORS

## Fichiers

### App Router (Next.js 13+)
- `app/api/proxy-upload/route.ts` - API proxy pour l'upload de fichiers
- `app/api/video-proxy/route.ts` - API proxy pour le streaming vidéo

### Fichiers modifiés
- `lib/sdcp-client-proxy.ts` - Client SDCP simplifié (WebSocket direct + API proxies)
- `lib/printer-context.tsx` - Utilise `SDCPClientProxy`
- `app/page.tsx` - Champs de configuration des ports
- `package.json` - Scripts Next.js standard

## Dépannage

### Le serveur ne démarre pas
Vérifiez que le port 3000 n'est pas déjà utilisé :
```bash
netstat -ano | findstr :3000
```

### La connexion à l'imprimante échoue
1. Vérifiez que l'IP de l'imprimante est correcte
2. Vérifiez que les ports WebSocket et Vidéo sont corrects
3. Vérifiez les logs dans la console du navigateur
4. Assurez-vous que l'imprimante est accessible sur le réseau

### Le streaming vidéo ne fonctionne pas
1. Vérifiez que le port vidéo est correct (généralement 3031)
2. Vérifiez que le flux vidéo de l'imprimante est actif
3. Consultez les logs dans la console du navigateur
## Avantages de cette architecture

1. **Simplicité** : Serveur Next.js standard, pas de serveur personnalisé
2. **Performance** : WebSocket direct pour les commandes (faible latence)
3. **Compatibilité** : Les uploads et le streaming vidéo passent par des APIs qui évitent les problèmes CORS
4. **Maintenabilité** : Code plus simple, moins de dépendances (pas besoin de Socket.IO)
5. **Déploiement** : Compatible avec Vercel, Netlify et autres plateformes Next.js

## Pourquoi cette approche ?

- **WebSocket direct** : Les commandes temps réel ont besoin de faible latence
- **API Proxies** : Les uploads et le streaming ont besoin d'éviter CORS et gérer les gros fichiers
- [ ] Implémenter le support multi-imprimantes
## Prochaines étapes

- [x] Ajouter la configuration des ports dans l'interface
- [x] Implémenter le proxy pour l'upload
- [x] Implémenter le proxy pour le streaming vidéo
- [ ] Ajouter l'authentification (optionnel)
- [ ] Améliorer les logs détaillés
- [ ] Implémenter le support multi-imprimantes (optionnel)

