# MiniLiga ⚽

**A Full-Stack Football League Management Platform**

MiniLiga is a web application designed to simplify the organization and management of amateur and mini-football leagues. It provides a centralized platform for managing teams, players, fixtures, match results, league standings, player statistics, and live match events.

The application combines an **Angular frontend** with an **ASP.NET Core Web API backend**, providing a modern and responsive user experience backed by a structured server-side architecture.

---
## Overview

Organizing a football league involves more than scheduling matches. Administrators need to manage teams and players, maintain fixtures, record match events.

MiniLiga aims to bring these tasks together in one application.

The platform is designed for amateur football leagues, mini-football competitions, local tournaments, and other small-scale football organizations.

### Project Goals

- Centralize league administration and match information.
- Provide convenient access to fixtures and league standings.
- Track match results and events.
- Maintain player and team statistics.
- Reduce manual work involved in organizing a competition.
- Provide a foundation for future improvements and additional features.

## Key Features

### 🏆 League Standings

- Display the league table.
- Present team positions and competition statistics.
- Keep league information organized in a centralized interface.

### 📅 Match Fixtures and Scheduling

- Organize fixtures by round.
- Display scheduled matches and match details.
- Support match scheduling and administration.

### ⚡ Live Match Tracking

- Follow match scores and recorded events.
- Manage match progress through administrative functionality.
- Record events such as goals and cards.
- Support real-time communication through SignalR where configured.

### 👥 Team Management

- Maintain team information.
- View registered teams.
- Search teams by name.
- Support administrative team management.

### 🧑‍🤝‍🧑 Player Management

- Maintain player information and team associations.
- Organize player records.
- Support player statistics associated with matches.

### 📊 Player Statistics

The application is designed to organize individual performance data, including:

- Goals.
- Assists.
- Cards.
- Other match-related statistics supported by the implementation.

### 🛠️ Administration

Administrative functionality is intended to provide centralized control over league data and match operations.

Depending on the configured permissions and implemented modules, administrative tasks include team and player management, fixture administration, and match event recording.

### 📱 Responsive Interface

The frontend is built with Angular and is intended to provide a user-friendly experience across desktop and mobile screen sizes.

---

## Technology Stack

### Frontend

- **Angular** — component-based web application framework.
- **TypeScript** — application logic and type safety.
- **HTML5** — page structure.
- **CSS3 / SCSS** — styling and responsive layouts.
- **npm** — dependency management.

### Backend

- **ASP.NET Core Web API** — server-side API.
- **C#** — backend application logic.
- **Entity Framework Core** — database access and migrations.
- **SignalR** — real-time communication, where configured.
- **JWT Authentication** — token-based authentication, where configured.

### Database

The application uses a database configured through the backend connection string. The specific database provider should match the backend configuration and installed Entity Framework Core provider.

### Development Tools

- Visual Studio Code or Visual Studio.
- Git and GitHub.
- Node.js and npm.
- .NET SDK compatible with the backend project.
- A configured database instance.
