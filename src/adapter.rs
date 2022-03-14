pub trait Adapter<T> {
    fn populate(self, target: T) -> T;
}
