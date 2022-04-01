mod station_adapter;

pub use station_adapter::StationAdapter;

pub trait Adapter<T> {
    fn populate(self, target: T) -> T;
}
