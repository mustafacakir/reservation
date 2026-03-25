# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore
COPY ["src/ReservationSystem.API/ReservationSystem.API.csproj", "src/ReservationSystem.API/"]
COPY ["src/ReservationSystem.Application/ReservationSystem.Application.csproj", "src/ReservationSystem.Application/"]
COPY ["src/ReservationSystem.Infrastructure/ReservationSystem.Infrastructure.csproj", "src/ReservationSystem.Infrastructure/"]
COPY ["src/ReservationSystem.Domain/ReservationSystem.Domain.csproj", "src/ReservationSystem.Domain/"]
RUN dotnet restore "src/ReservationSystem.API/ReservationSystem.API.csproj"

# Copy source and build
COPY . .
WORKDIR "/src/src/ReservationSystem.API"
RUN dotnet build "ReservationSystem.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "ReservationSystem.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ReservationSystem.API.dll"]
