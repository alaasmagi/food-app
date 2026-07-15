# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only project files first so `dotnet restore` layer is cached
# independently of source-code changes. Tests.csproj is deliberately
# NOT copied here - it is not part of the published image.
COPY Directory.Build.props ./
COPY Domain/Domain.csproj Domain/
COPY DTO/DTO.csproj DTO/
COPY Contracts/Contracts.csproj Contracts/
COPY DataAccess/DataAccess.csproj DataAccess/
COPY Application/Application.csproj Application/
COPY External/External.csproj External/
COPY Web/Web.csproj Web/

RUN dotnet restore Web/Web.csproj

# Now copy the rest of the source and publish
COPY Domain/ Domain/
COPY DTO/ DTO/
COPY Contracts/ Contracts/
COPY DataAccess/ DataAccess/
COPY Application/ Application/
COPY External/ External/
COPY Web/ Web/

RUN dotnet publish Web/Web.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Non-root user; /data is where the SQLite offer cache file lives
RUN useradd --uid 1000 --create-home appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /data /app

COPY --from=build /app/publish .

USER appuser

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Web.dll"]
