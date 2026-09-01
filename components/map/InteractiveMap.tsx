            {/* Location markers: characters + events */}
            {declutteredLocations.map((loc) => {
              const charEntries = charactersByLocation.get(loc.name) ?? [];
              const events = visibleEventsByLocation.get(loc.name) ?? [];
              if (charEntries.length === 0 && events.length === 0) return null;

              const visibleEntries = charEntries.slice(0, MAX_VISIBLE_AVATARS);
              const overflowEntries = charEntries.slice(MAX_VISIBLE_AVATARS);
              const clusterKey = `chars-${loc.name}`;
              const eventClusterKey = `events-${loc.name}`;

              const isClusterRaised =
                openCluster === clusterKey ||
                lockedCluster === clusterKey ||
                openCluster === eventClusterKey ||
                lockedCluster === eventClusterKey;

              const isCurrentEventChapter = (slug: string) =>
                chapters[chapterIndex]?.slug === slug;

              return (
                <div
                  key={loc.name}
                  className={`${styles.locationMarker} ${
                    isClusterRaised ? styles.locationMarkerRaised : ""
                  }`}
                  style={{
                    left: `${loc.offsetXPct}%`,
                    top: `${loc.offsetYPct}%`,
                  }}
                >
                  {charEntries.length > 0 && (
                    <div
                      className={styles.avatarRow}
                      onMouseEnter={() => {
                        if (
                          overflowEntries.length > 0 &&
                          lockedCluster !== clusterKey
                        ) {
                          setOpenCluster(clusterKey);
                        }
                      }}
                      onMouseLeave={() => {
                        if (lockedCluster !== clusterKey) {
                          setOpenCluster((k) =>
                            k === clusterKey ? null : k
                          );
                        }
                      }}
                    >
                      {visibleEntries.map((entry) => {
                        const id = entry.id;
                        const c = charactersById.get(id);
                        const isSelected = id === selectedCharacterId;

                        const isPulsing =
                          isSelected &&
                          !entry.faded &&
                          selectedCharacterCurrentLocation?.name === loc.name;

                        return (
                          <button
                            key={id}
                            className={`${styles.avatarButton} ${
                              isSelected ? styles.avatarSelected : ""
                            } ${
                              entry.faded ? styles.avatarFaded : ""
                            }`}
                            title={
                              entry.status === "dead"
                                ? `${c?.name ?? id} (last seen here — presumed dead)`
                                : entry.status === "unknown"
                                  ? `${c?.name ?? id} (last seen here — whereabouts unknown)`
                                  : entry.faded
                                    ? `${c?.name ?? id} (passing by)`
                                    : c?.name ?? id
                            }
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();

                              setSelectedCharacterId(
                                id === selectedCharacterId ? null : id
                              );
                            }}
                          >
                            {isPulsing && (
                              <span className={styles.pulseRing} />
                            )}

                            <Avatar
                              characterId={id}
                              name={c?.name ?? id}
                              size={
                                entry.faded
                                  ? FADED_AVATAR_SIZE
                                  : NORMAL_AVATAR_SIZE
                              }
                              status={entry.status}
                            />
                          </button>
                        );
                      })}

                      {overflowEntries.length > 0 && (
                        <div className={styles.overflowWrap}>
                          <button
                            className={styles.overflowBadge}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (lockedCluster === clusterKey) {
                                setLockedCluster(null);
                                setOpenCluster(null);
                              } else {
                                setLockedCluster(clusterKey);
                                setOpenCluster(clusterKey);
                              }
                            }}
                            aria-label={`Show all characters at ${loc.name}`}
                          >
                            {overflowEntries.length}+
                          </button>
                        </div>
                      )}

                      {(openCluster === clusterKey ||
                        lockedCluster === clusterKey) && (
                        <div
                          className={styles.flyout}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.flyoutTitle}>
                            {loc.name}
                          </div>

                          {charEntries.map((entry) => {
                            const c = charactersById.get(entry.id);

                            return (
                              <button
                                key={entry.id}
                                className={styles.flyoutRow}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setSelectedCharacterId(entry.id);
                                  setOpenCluster(null);
                                  setLockedCluster(null);
                                }}
                              >
                                <Avatar
                                  characterId={entry.id}
                                  name={c?.name ?? entry.id}
                                  size={24}
                                  status={entry.status}
                                />

                                <span>
                                  {c?.name ?? entry.id}

                                  {entry.status === "dead" && (
                                    <span
                                      className={styles.flyoutFadedTag}
                                    >
                                      {" "}
                                      (dead)
                                    </span>
                                  )}

                                  {entry.status === "unknown" && (
                                    <span
                                      className={styles.flyoutFadedTag}
                                    >
                                      {" "}
                                      (whereabouts unknown)
                                    </span>
                                  )}

                                  {entry.status === "alive" &&
                                    entry.faded && (
                                      <span
                                        className={styles.flyoutFadedTag}
                                      >
                                        {" "}
                                        (passing by)
                                      </span>
                                    )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {events.length > 0 && (
                    <div
                      className={styles.eventCluster}
                      onMouseEnter={() => {
                        if (lockedCluster !== eventClusterKey) {
                          setOpenCluster(eventClusterKey);
                        }
                      }}
                      onMouseLeave={() => {
                        if (lockedCluster !== eventClusterKey) {
                          setOpenCluster((k) =>
                            k === eventClusterKey ? null : k
                          );
                        }
                      }}
                    >
                      <button
                        className={`${styles.eventIcon} ${
                          isCurrentEventChapter(events[0].chapterSlug)
                            ? styles.eventPulse
                            : ""
                        }`}
                        aria-label={
                          events.length === 1
                            ? events[0].title
                            : `${events.length} events at ${loc.name}`
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (lockedCluster === eventClusterKey) {
                            setLockedCluster(null);
                            setOpenCluster(null);
                          } else {
                            setLockedCluster(eventClusterKey);
                            setOpenCluster(eventClusterKey);
                          }
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={MAP_EVENT_TYPE_ICONS[events[0].type]}
                          alt={events[0].type}
                        />

                        {events.length > 1 && (
                          <span className={styles.eventCount}>
                            {events.length}
                          </span>
                        )}
                      </button>

                      {(openCluster === eventClusterKey ||
                        lockedCluster === eventClusterKey) && (
                        <div
                          className={styles.flyout}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.flyoutTitle}>
                            {loc.name}
                          </div>

                          {events.map((ev) => (
                            <button
                              key={ev.id}
                              className={styles.flyoutRow}
                              onClick={(e) => {
                                e.stopPropagation();

                                setOpenCluster(null);
                                setLockedCluster(null);

                                router.push(
                                  `/chapters/${ev.chapterSlug}`
                                );
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={MAP_EVENT_TYPE_ICONS[ev.type]}
                                alt=""
                                width={18}
                                height={18}
                              />

                              <span>{ev.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}