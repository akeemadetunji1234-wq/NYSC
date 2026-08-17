# OpenStreetMap healthcare and security tag research — 2026-08-16

## Sources reviewed

- https://wiki.openstreetmap.org/wiki/Tag:amenity=hospital — Hospitals and complex hospital facilities.
- https://wiki.openstreetmap.org/wiki/Tag:healthcare%3Dclinic — Healthcare clinics and outpatient facilities.
- https://wiki.openstreetmap.org/wiki/Tag:healthcare%3Dcentre — General healthcare centres.
- https://wiki.openstreetmap.org/wiki/Key:healthcare:speciality — Healthcare specialty tagging.
- https://wiki.openstreetmap.org/wiki/Tag:amenity=police — Police facilities and the distinction between public police facilities and other police facilities.
- https://wiki.openstreetmap.org/wiki/Tag:office%3Dsecurity — Private security offices.
- https://wiki.openstreetmap.org/Tag:amenity%3Dsecurity_control — Security-control facilities, including controlled-access sites.
- https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcheckpoint — Dedicated access-control/checkpoint locations.
- https://wiki.openstreetmap.org/wiki/Map_features — General OSM map-feature tagging reference.

## Implementation implications

The existing Nearby Essentials query only covers a narrow set of healthcare and security tags. Broader healthcare coverage should include both `amenity` and `healthcare` keys, including hospitals, clinics, doctors, healthcare centres, pharmacies, dentists, and emergency/first-aid facilities where the category is explicitly healthcare-related. Security coverage should include public police facilities, private security offices, security-control facilities, checkpoints, and police-related records that use a `police=*` tag without `amenity=police`.

The query must continue requiring a non-empty name before displaying a place, must preserve the 30 km haversine filter, and must avoid broad generic tags that would return unrelated offices or buildings. The application should label the returned record using its name and source; it must not infer an unverified public rating from the OSM tag alone.

## Confirmed from source pages

The hospital reference confirms that `amenity=hospital` is the established hospital tag and that `healthcare=hospital` is also used as a duplicate by some data contributors. It explicitly distinguishes outpatient facilities (`amenity=clinic`) and individual doctors' offices (`amenity=doctors`).

The police reference confirms that public-facing police facilities use `amenity=police`, while non-public police facilities can use a `police=*` value such as `police=barracks`. This supports including `police` as a key existence filter in addition to `amenity=police`. The security category should also include `office=security`, `amenity=security_control`, and `amenity=checkpoint`, while retaining a required name to avoid displaying anonymous infrastructure.
