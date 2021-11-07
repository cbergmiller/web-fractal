/**
 * Return the last item of the given array.
 * @param items
 */
export function tail(items: Array<any>) {
    if (items && items.length) {
        return items[items.length - 1];
    }
}
